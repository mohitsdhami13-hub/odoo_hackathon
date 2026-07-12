import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !['ADMIN', 'ASSET_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, departmentId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Determine which assets to include in the audit
    let assetWhere = { status: { not: 'RETIRED' } }; // exclude retired/disposed assets

    if (departmentId) {
      // Find assets allocated to employees in this department, OR allocated to the department directly
      assetWhere = {
        ...assetWhere,
        allocations: {
          some: {
            status: 'ACTIVE',
            OR: [
              { employee: { departmentId: departmentId } },
              { departmentId: departmentId }
            ]
          }
        }
      };
    }

    const assetsToAudit = await prisma.asset.findMany({
      where: assetWhere,
      select: { id: true }
    });

    if (assetsToAudit.length === 0) {
      return NextResponse.json({ error: 'No active assets found for this scope.' }, { status: 400 });
    }

    // Create the Audit Cycle and its items in a transaction
    const audit = await prisma.auditCycle.create({
      data: {
        name,
        departmentId: departmentId || null,
        createdBy: session.user.id,
        items: {
          create: assetsToAudit.map(asset => ({
            assetId: asset.id,
            status: 'UNVERIFIED'
          }))
        }
      }
    });

    return NextResponse.json({ audit });
  } catch (error) {
    console.error('Audit create error:', error);
    return NextResponse.json({ error: 'Failed to create audit cycle' }, { status: 500 });
  }
}

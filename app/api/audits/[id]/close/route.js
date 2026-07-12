import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !['ADMIN', 'ASSET_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const auditCycle = await prisma.auditCycle.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!auditCycle || auditCycle.status === 'CLOSED') {
      return NextResponse.json({ error: 'Audit cycle not found or already closed' }, { status: 400 });
    }

    // Process missing/damaged items
    const missingItems = auditCycle.items.filter(item => item.status === 'MISSING');
    
    await prisma.$transaction(async (tx) => {
      // 1. Close the audit
      await tx.auditCycle.update({
        where: { id },
        data: { status: 'CLOSED', endDate: new Date() }
      });

      // 2. Mark missing assets as RETIRED
      for (const item of missingItems) {
        await tx.asset.update({
          where: { id: item.assetId },
          data: { status: 'RETIRED', condition: 'Missing (Audit Flag)' }
        });

        // 3. Log activity for each missing asset
        await tx.activityLog.create({
          data: {
            action: 'ASSET_MISSING_IN_AUDIT',
            assetId: item.assetId,
            userId: session.user.id,
            details: `Flagged as missing in Audit: ${auditCycle.name}`
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Audit close error:', error);
    return NextResponse.json({ error: 'Failed to close audit cycle' }, { status: 500 });
  }
}

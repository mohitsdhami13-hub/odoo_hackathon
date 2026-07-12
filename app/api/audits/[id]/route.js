import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || !['ADMIN', 'ASSET_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { itemId, status, notes } = body;

    if (!itemId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const auditCycle = await prisma.auditCycle.findUnique({ where: { id } });
    if (!auditCycle || auditCycle.status === 'CLOSED') {
      return NextResponse.json({ error: 'Audit cycle not found or is closed' }, { status: 400 });
    }

    const updatedItem = await prisma.auditItem.update({
      where: { id: itemId },
      data: { status, notes }
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error('Update audit item error:', error);
    return NextResponse.json({ error: 'Failed to update audit item' }, { status: 500 });
  }
}

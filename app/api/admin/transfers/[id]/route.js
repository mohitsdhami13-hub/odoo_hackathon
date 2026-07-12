import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

import { z } from 'zod';
import { logActivity } from '@/lib/logActivity';

const WRITE_ROLES = ['ADMIN', 'ASSET_MANAGER'];

// PATCH /api/admin/transfers/[id]  — approve or reject a transfer request
export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session || !WRITE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: transferId } = await params;
  const body = await req.json();
  const { action } = body; // 'APPROVED' | 'REJECTED'

  if (!['APPROVED', 'REJECTED'].includes(action)) {
    return NextResponse.json({ error: 'action must be APPROVED or REJECTED' }, { status: 400 });
  }

  const transfer = await prisma.transferRequest.findUnique({ where: { id: transferId } });
  if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
  if (transfer.status !== 'PENDING') {
    return NextResponse.json({ error: 'Transfer is no longer pending' }, { status: 409 });
  }

  if (action === 'REJECTED') {
    const updated = await prisma.transferRequest.update({
      where: { id: transferId },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    });

    await logActivity({
      action: 'TRANSFER_REJECTED',
      assetId: transfer.assetId,
      userId: session.user.id,
      details: 'Transfer request was rejected',
    });

    return NextResponse.json({ data: updated });
  }

  // ── APPROVE: close old allocation → open new one → update asset ─────────────
  const result = await prisma.$transaction(async (tx) => {
    // Close any active allocation on this asset
    await tx.allocation.updateMany({
      where: { assetId: transfer.assetId, status: 'ACTIVE' },
      data: { status: 'RETURNED', returnedAt: new Date() },
    });

    // Open new allocation for the transfer target
    const newAllocation = await tx.allocation.create({
      data: {
        assetId: transfer.assetId,
        employeeId: transfer.toEmployeeId ?? null,
        status: 'ACTIVE',
      },
      include: {
        employee: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Mark transfer resolved
    await tx.transferRequest.update({
      where: { id: transferId },
      data: { status: 'APPROVED', resolvedAt: new Date() },
    });

    // Asset stays ALLOCATED (it still has an active allocation)
    return newAllocation;
  });

  await logActivity({
    action: 'TRANSFER_APPROVED',
    assetId: transfer.assetId,
    userId: session.user.id,
    details: `Transfer approved to ${result.employee?.name || result.department?.name || 'Unknown'}`,
  });

  return NextResponse.json({ data: result });
}

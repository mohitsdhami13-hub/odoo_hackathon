import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

import { logActivity } from '@/lib/logActivity';

const MANAGER_ROLES = ['ADMIN', 'ASSET_MANAGER'];

// PATCH /api/maintenance/[id]  — approve | reject | resolve
export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session || !MANAGER_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body; // 'APPROVED' | 'REJECTED' | 'RESOLVED'

  if (!['APPROVED', 'REJECTED', 'RESOLVED'].includes(action)) {
    return NextResponse.json(
      { error: 'action must be APPROVED, REJECTED, or RESOLVED' },
      { status: 400 }
    );
  }

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  // Validate state transitions
  const validTransitions = {
    APPROVED: ['PENDING'],
    REJECTED: ['PENDING'],
    RESOLVED: ['APPROVED', 'IN_PROGRESS'],
  };

  if (!validTransitions[action]?.includes(request.status)) {
    return NextResponse.json(
      { error: `Cannot ${action} a request that is ${request.status}.` },
      { status: 409 }
    );
  }

  // ── Approve: asset → UNDER_MAINTENANCE ───────────────────────────────────
  // ── Resolve: asset → AVAILABLE ───────────────────────────────────────────
  // ── Reject: asset stays unchanged ────────────────────────────────────────
  const assetStatus =
    action === 'APPROVED' ? 'UNDER_MAINTENANCE'
    : action === 'RESOLVED' ? 'AVAILABLE'
    : null;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: action === 'APPROVED' ? 'APPROVED'
              : action === 'REJECTED' ? 'REJECTED'
              : 'RESOLVED',
        resolvedAt: action === 'RESOLVED' ? new Date() : undefined,
      },
      include: {
        asset: { select: { id: true, name: true } },
        raisedBy: { select: { id: true, name: true } },
      },
    });

    if (assetStatus) {
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: assetStatus },
      });
    }

    return updated;
  });

  await logActivity({
    action: `MAINTENANCE_${action}`,
    assetId: request.assetId,
    userId: session.user.id,
    details: `Maintenance request was ${action.toLowerCase()}`,
  });

  return NextResponse.json({ data: result });
}

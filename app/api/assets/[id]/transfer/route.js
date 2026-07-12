import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logActivity } from '@/lib/logActivity';

const transferSchema = z.object({
  toEmployeeId: z.string().cuid().optional(),
  toDepartmentId: z.string().cuid().optional(),
});

// POST /api/assets/[id]/transfer  — create a transfer request
export async function POST(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: assetId } = await params;
  const body = await req.json();
  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.toEmployeeId && !parsed.data.toDepartmentId) {
    return NextResponse.json(
      { error: 'Provide either toEmployeeId or toDepartmentId.' },
      { status: 400 }
    );
  }

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  // Prevent duplicate pending requests for the same asset
  const existingPending = await prisma.transferRequest.findFirst({
    where: { assetId, status: 'PENDING' },
  });
  if (existingPending) {
    return NextResponse.json(
      { error: 'A transfer request for this asset is already pending.' },
      { status: 409 }
    );
  }

  const transfer = await prisma.transferRequest.create({
    data: {
      assetId,
      requestedById: session.user.id,
      toEmployeeId: parsed.data.toEmployeeId ?? null,
      status: 'PENDING',
    },
  });

  await logActivity({
    action: 'TRANSFER_REQUESTED',
    assetId,
    userId: session.user.id,
    details: `Transfer requested for asset`,
  });

  return NextResponse.json({ data: transfer }, { status: 201 });
}

// GET /api/assets/[id]/transfer  — list transfer requests for an asset
export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: assetId } = await params;

  const transfers = await prisma.transferRequest.findMany({
    where: { assetId },
    orderBy: { requestedAt: 'desc' },
  });

  return NextResponse.json({ data: transfers });
}

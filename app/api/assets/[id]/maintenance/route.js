import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logActivity } from '@/lib/logActivity';

const raiseSchema = z.object({
  issue: z.string().min(5, 'Please describe the issue (min 5 chars)').max(500),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
});

// GET /api/assets/[id]/maintenance
export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: assetId } = await params;

  const requests = await prisma.maintenanceRequest.findMany({
    where: { assetId },
    include: {
      raisedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: requests });
}

// POST /api/assets/[id]/maintenance — raise a request
export async function POST(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: assetId } = await params;

  const body = await req.json();
  const parsed = raiseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId,
      raisedById: session.user.id,
      issue: parsed.data.issue,
      priority: parsed.data.priority,
      status: 'PENDING',
    },
    include: { raisedBy: { select: { id: true, name: true } } },
  });

  await logActivity({
    action: 'MAINTENANCE_RAISED',
    assetId,
    userId: session.user.id,
    details: `Priority: ${parsed.data.priority}, Issue: ${parsed.data.issue.substring(0, 50)}...`,
  });

  return NextResponse.json({ data: request }, { status: 201 });
}

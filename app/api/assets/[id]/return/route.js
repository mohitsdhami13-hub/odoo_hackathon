import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logActivity } from '@/lib/logActivity';

const WRITE_ROLES = ['ADMIN', 'ASSET_MANAGER'];

const returnSchema = z.object({
  conditionOnReturn: z.string().optional(),
});

export async function POST(req, { params }) {
  const session = await auth();
  if (!session || !WRITE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: assetId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = returnSchema.safeParse(body);

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  const activeAllocation = await prisma.allocation.findFirst({
    where: { assetId, status: 'ACTIVE' },
  });

  if (!activeAllocation) {
    return NextResponse.json(
      { error: 'No active allocation found for this asset.' },
      { status: 409 }
    );
  }

  // Close allocation + flip asset back to AVAILABLE in one transaction
  await prisma.$transaction(async (tx) => {
    await tx.allocation.update({
      where: { id: activeAllocation.id },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        conditionOnReturn: parsed.success ? (parsed.data.conditionOnReturn ?? null) : null,
      },
    });

    await tx.asset.update({
      where: { id: assetId },
      data: { status: 'AVAILABLE' },
    });
    
    return allocation;
  });

  await logActivity({
    action: 'RETURNED',
    assetId,
    userId: session.user.id,
    details: parsed.success && parsed.data.conditionOnReturn ? `Condition: ${parsed.data.conditionOnReturn}` : 'Returned in good condition',
  });

  return NextResponse.json({ data: result });
}

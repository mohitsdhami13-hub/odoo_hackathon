import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logActivity } from '@/lib/logActivity';

const WRITE_ROLES = ['ADMIN', 'ASSET_MANAGER'];

const allocateSchema = z.object({
  employeeId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  expectedReturnDate: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function POST(req, { params }) {
  const session = await auth();
  if (!session || !WRITE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: assetId } = await params;
  const body = await req.json();
  const parsed = allocateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Must allocate to either an employee OR a department
  if (!parsed.data.employeeId && !parsed.data.departmentId) {
    return NextResponse.json(
      { error: 'Provide either employeeId or departmentId.' },
      { status: 400 }
    );
  }

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  // ── Conflict check ─────────────────────────────────────────────────────────
  const activeAllocation = await prisma.allocation.findFirst({
    where: { assetId, status: 'ACTIVE' },
    include: {
      employee: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  if (activeAllocation) {
    const holder =
      activeAllocation.employee?.name ||
      activeAllocation.department?.name ||
      'another party';
    return NextResponse.json(
      {
        error: `Currently held by ${holder}. Use "Request Transfer" to request a handover.`,
        conflict: true,
        activeAllocationId: activeAllocation.id,
      },
      { status: 409 }
    );
  }

  // ── Create allocation + update asset status in one transaction ──────────────
  const result = await prisma.$transaction(async (tx) => {
    const allocation = await tx.allocation.create({
      data: {
        assetId,
        employeeId: parsed.data.employeeId ?? null,
        departmentId: parsed.data.departmentId ?? null,
        expectedReturnDate: parsed.data.expectedReturnDate
          ? new Date(parsed.data.expectedReturnDate)
          : null,
        status: 'ACTIVE',
      },
      include: {
        employee: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    await tx.asset.update({
      where: { id: assetId },
      data: { status: 'ALLOCATED' },
    });

    return allocation;
  });

  const holder = result.employee?.name || result.department?.name || 'Unknown';
  await logActivity({
    action: 'ALLOCATED',
    assetId,
    userId: session.user.id,
    details: `Allocated to ${holder}`,
  });

  return NextResponse.json({ data: result }, { status: 201 });
}

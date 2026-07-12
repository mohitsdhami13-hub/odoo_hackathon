import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logActivity } from '@/lib/logActivity';

const bookingSchema = z.object({
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// GET /api/assets/[id]/bookings — list bookings for an asset
export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: assetId } = await params;

  const bookings = await prisma.booking.findMany({
    where: { assetId },
    include: {
      bookedBy: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  return NextResponse.json({ data: bookings });
}

// POST /api/assets/[id]/bookings — create booking (with overlap check)
export async function POST(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: assetId } = await params;

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { startTime: startRaw, endTime: endRaw } = parsed.data;
  const startTime = new Date(startRaw);
  const endTime = new Date(endRaw);

  // Verify the asset exists and is bookable
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, name: true, isBookable: true },
  });
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  if (!asset.isBookable) {
    return NextResponse.json(
      { error: 'This asset is not marked as bookable.' },
      { status: 400 }
    );
  }

  // ── Overlap check ─────────────────────────────────────────────────────────
  // From the build plan:
  //   status in [UPCOMING, ONGOING]
  //   AND startTime < endTime (requested)
  //   AND endTime > startTime (requested)
  const conflict = await prisma.booking.findFirst({
    where: {
      assetId,
      status: { in: ['UPCOMING', 'ONGOING'] },
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    },
    include: { bookedBy: { select: { name: true } } },
  });

  if (conflict) {
    return NextResponse.json(
      {
        error: `Time slot overlaps an existing booking by ${conflict.bookedBy.name} (${new Date(conflict.startTime).toLocaleString()} – ${new Date(conflict.endTime).toLocaleString()}).`,
        conflict: true,
      },
      { status: 409 }
    );
  }

  // ── Create booking ────────────────────────────────────────────────────────
  const booking = await prisma.booking.create({
    data: {
      assetId,
      bookedById: session.user.id,
      startTime,
      endTime,
      status: 'UPCOMING',
    },
    include: { bookedBy: { select: { id: true, name: true } } },
  });

  await logActivity({
    action: 'BOOKED',
    assetId,
    userId: session.user.id,
    details: `Booked for ${new Date(startTime).toLocaleDateString()}`,
  });

  return NextResponse.json({ data: booking }, { status: 201 });
}

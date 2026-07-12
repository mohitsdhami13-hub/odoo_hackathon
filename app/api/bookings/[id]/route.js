import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// PATCH /api/bookings/[id]  — cancel a booking
export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action } = body; // only 'CANCEL' for now

  if (action !== 'CANCEL') {
    return NextResponse.json({ error: 'action must be CANCEL' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  // Only the owner or an admin/asset_manager can cancel
  const canCancel =
    booking.bookedById === session.user.id ||
    ['ADMIN', 'ASSET_MANAGER'].includes(session.user.role);

  if (!canCancel) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!['UPCOMING', 'ONGOING'].includes(booking.status)) {
    return NextResponse.json(
      { error: 'Only UPCOMING or ONGOING bookings can be cancelled.' },
      { status: 409 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ data: updated });
}

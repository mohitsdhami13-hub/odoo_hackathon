import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const MANAGER_ROLES = ['ADMIN', 'ASSET_MANAGER'];

// GET /api/maintenance — list all requests (managers) or own (others)
export async function GET(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isManager = MANAGER_ROLES.includes(session.user.role);

  const { searchParams } = req.nextUrl;
  const statusFilter = searchParams.get('status'); // optional filter

  const requests = await prisma.maintenanceRequest.findMany({
    where: {
      ...(isManager ? {} : { raisedById: session.user.id }),
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      raisedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: requests });
}

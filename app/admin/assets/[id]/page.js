import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import AllocatePanel from '@/components/assets/AllocatePanel';
import BookingPanel from '@/components/assets/BookingPanel';
import MaintenancePanel from '@/components/assets/MaintenancePanel';

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  RESERVED: 'Reserved',
  UNDER_MAINTENANCE: 'Under maintenance',
  RETIRED: 'Retired',
};

const STATUS_STYLES = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  ALLOCATED: 'bg-indigo-100 text-indigo-700',
  RESERVED: 'bg-amber-100 text-amber-700',
  UNDER_MAINTENANCE: 'bg-orange-100 text-orange-700',
  RETIRED: 'bg-slate-200 text-slate-600',
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({ where: { id }, select: { name: true, assetTag: true } });
  return { title: asset ? `${asset.name} (${asset.assetTag}) — AssetFlow` : 'Asset — AssetFlow' };
}

export default async function AssetDetailPage({ params }) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      allocations: {
        orderBy: { allocatedAt: 'desc' },
        include: {
          employee: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!asset) notFound();

  // Serialise Dates → strings so the Client Component can receive them
  const serialisedAsset = JSON.parse(JSON.stringify(asset));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

      {/* Breadcrumb */}
      <nav className="text-sm text-slate-400">
        <Link href="/admin/assets" className="hover:text-indigo-600 transition-colors">
          Assets
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">{asset.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-slate-400">{asset.assetTag}</p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-0.5">{asset.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{asset.category?.name}</p>
        </div>
        <span
          className={`inline-flex h-fit rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[asset.status]}`}
        >
          {STATUS_LABELS[asset.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left: details + history ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Details card */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3">
            {[
              ['Serial number', asset.serialNumber || '—'],
              ['Condition', asset.condition || '—'],
              ['Location', asset.location || '—'],
              ['Bookable', asset.isBookable ? 'Yes' : 'No'],
              ['Acquisition cost', asset.acquisitionCost ? `₹${asset.acquisitionCost.toLocaleString()}` : '—'],
              [
                'Acquisition date',
                asset.acquisitionDate
                  ? new Date(asset.acquisitionDate).toLocaleDateString()
                  : '—',
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="font-medium text-slate-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Allocation history */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Allocation history</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Held by</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Allocated</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Expected return</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Returned</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asset.allocations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">
                        No allocation history yet.
                      </td>
                    </tr>
                  )}
                  {asset.allocations.map((alloc) => (
                    <tr key={alloc.id} className={alloc.status === 'ACTIVE' ? 'bg-indigo-50' : ''}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {alloc.employee?.name || alloc.department?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(alloc.allocatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {alloc.expectedReturnDate
                          ? new Date(alloc.expectedReturnDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {alloc.returnedAt
                          ? new Date(alloc.returnedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            alloc.status === 'ACTIVE'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {alloc.status === 'ACTIVE' ? 'Active' : 'Returned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right: Panels ───────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <AllocatePanel asset={serialisedAsset} userRole={session.user.role} />
          <BookingPanel asset={serialisedAsset} userId={session.user.id} />
          <MaintenancePanel asset={serialisedAsset} userRole={session.user.role} />
        </div>
      </div>
    </div>
  );
}
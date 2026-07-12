import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import AssetForm from '@/components/assets/AssetForm';
import AssetList from '@/components/assets/AssetList';

export const metadata = {
  title: 'Assets — AssetFlow',
};

const WRITE_ROLES = ['ADMIN', 'ASSET_MANAGER'];

export default async function AssetsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const canRegister = WRITE_ROLES.includes(session.user.role);

  // ── Fetch Dashboard KPIs ───────────────────────────────────────────
  const [
    totalAssets,
    availableCount,
    allocatedCount,
    maintenanceCount,
    overdueAllocations,
    recentActivity,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: 'AVAILABLE' } }),
    prisma.asset.count({ where: { status: 'ALLOCATED' } }),
    prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } }),
    prisma.allocation.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: { lt: new Date() },
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        employee: { select: { name: true } },
        department: { select: { name: true } },
      },
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        asset: { select: { name: true, assetTag: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard &amp; Assets</h1>
        <p className="mt-1 text-sm text-slate-500">
          {canRegister
            ? 'Overview of organisation assets and asset directory.'
            : 'Organisation asset directory.'}
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Assets', value: totalAssets, style: 'text-slate-700' },
          { label: 'Available', value: availableCount, style: 'text-emerald-600' },
          { label: 'Allocated', value: allocatedCount, style: 'text-indigo-600' },
          { label: 'In Maintenance', value: maintenanceCount, style: 'text-orange-600' },
        ].map(({ label, value, style }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${style}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Overdue Allocations Alerts ────────────────────────────────── */}
      {overdueAllocations.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-red-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">
                Overdue Returns ({overdueAllocations.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {overdueAllocations.map((alloc) => (
                  <li key={alloc.id} className="text-sm text-red-700">
                    <Link href={`/admin/assets/${alloc.asset.id}`} className="font-medium hover:underline">
                      {alloc.asset.name} ({alloc.asset.assetTag})
                    </Link>{' '}
                    — held by {alloc.employee?.name || alloc.department?.name}. Was due back on{' '}
                    <span className="font-semibold">{new Date(alloc.expectedReturnDate).toLocaleDateString()}</span>.
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Asset Form (Privileged) ───────────────────────────────────── */}
      {canRegister && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Register New Asset</h2>
          <AssetForm />
        </div>
      )}

      {/* ── Grid Layout for Feed & Directory ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col: Asset Directory */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Asset Directory</h2>
          <AssetList />
        </div>

        {/* Right Col: Activity Feed */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No activity yet.</p>
          ) : (
            <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-4">
              {recentActivity.map((log) => (
                <div key={log.id} className="relative pl-6">
                  {/* Dot */}
                  <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-slate-50" />
                  <p className="text-sm font-medium text-slate-900">
                    {log.user?.name || 'System'} <span className="font-normal text-slate-600">performed</span> {log.action}
                  </p>
                  {log.asset && (
                    <p className="text-xs font-medium text-indigo-600 mt-0.5">
                      {log.asset.name} ({log.asset.assetTag})
                    </p>
                  )}
                  {log.details && (
                    <p className="text-xs text-slate-500 mt-1 bg-slate-50 border border-slate-100 rounded p-1.5 inline-block">
                      {log.details}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
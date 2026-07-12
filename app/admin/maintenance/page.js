import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Maintenance — AssetFlow' };

const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
};

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-600',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
};

export default async function MaintenancePage() {
  const session = await auth();
  if (!session) redirect('/login');

  const isPrivileged = ['ADMIN', 'ASSET_MANAGER'].includes(session.user.role);

  const requests = await prisma.maintenanceRequest.findMany({
    where: isPrivileged ? {} : { raisedById: session.user.id },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      raisedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const open = requests.filter((r) => !['REJECTED', 'RESOLVED'].includes(r.status));
  const closed = requests.filter((r) => ['REJECTED', 'RESOLVED'].includes(r.status));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Maintenance</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isPrivileged ? 'All maintenance requests across the organisation.' : 'Your maintenance requests.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Pending', value: requests.filter((r) => r.status === 'PENDING').length, style: 'text-amber-600' },
          { label: 'Approved', value: requests.filter((r) => r.status === 'APPROVED').length, style: 'text-indigo-600' },
          { label: 'In Progress', value: requests.filter((r) => r.status === 'IN_PROGRESS').length, style: 'text-blue-600' },
          { label: 'Resolved', value: requests.filter((r) => r.status === 'RESOLVED').length, style: 'text-emerald-600' },
        ].map(({ label, value, style }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${style}`}>{value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Open requests</h2>
        {open.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No open maintenance requests.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Asset</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Issue</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Raised By</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Priority</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {open.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/assets/${r.asset.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {r.asset.name}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-slate-400">{r.asset.assetTag}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={r.issue}>{r.issue}</td>
                    <td className="px-4 py-3 text-slate-600">{r.raisedBy.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[r.priority]}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {closed.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Closed requests</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Asset</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Issue</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Raised By</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closed.map((r) => (
                  <tr key={r.id} className="opacity-70">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/assets/${r.asset.id}`}
                        className="font-medium text-slate-600 hover:underline"
                      >
                        {r.asset.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={r.issue}>{r.issue}</td>
                    <td className="px-4 py-3 text-slate-600">{r.raisedBy.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {requests.length === 0 && (
        <p className="text-sm text-slate-400 italic">No maintenance requests yet.</p>
      )}
    </div>
  );
}

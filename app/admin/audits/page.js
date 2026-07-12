import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NewAuditModal from '@/components/NewAuditModal';

export const metadata = {
  title: 'Audits - AssetFlow',
};

export default async function AuditsPage() {
  const session = await auth();
  if (!session || !['ADMIN', 'ASSET_MANAGER'].includes(session.user.role)) {
    redirect('/admin/assets');
  }

  const [audits, departments] = await Promise.all([
    prisma.auditCycle.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        department: true,
        creator: true,
        _count: {
          select: { items: true }
        },
        items: {
          select: { status: true }
        }
      }
    }),
    prisma.department.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Audits</h1>
          <p className="text-slate-500">Run structured verification cycles and identify discrepancies.</p>
        </div>
        <NewAuditModal departments={departments} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-[var(--color-white)] shadow-sm overflow-hidden">
        {audits.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No audit cycles have been created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Audit Name</th>
                  <th className="px-6 py-4">Scope</th>
                  <th className="px-6 py-4">Date Started</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audits.map((audit) => {
                  const total = audit._count.items;
                  const verified = audit.items.filter(i => i.status !== 'UNVERIFIED').length;
                  const progress = total === 0 ? 0 : Math.round((verified / total) * 100);

                  return (
                    <tr key={audit.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {audit.name}
                        <div className="text-xs text-slate-500 font-normal">By {audit.creator?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {audit.department ? audit.department.name : 'Global (All Assets)'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(audit.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${audit.status === 'CLOSED' ? 'bg-slate-400' : 'bg-indigo-500'}`} 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                          <span className="text-xs text-slate-500">{verified}/{total}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          audit.status === 'OPEN' 
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' 
                            : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10'
                        }`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/admin/audits/${audit.id}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                        >
                          {audit.status === 'OPEN' ? 'Execute' : 'View Report'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

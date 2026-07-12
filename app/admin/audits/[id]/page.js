import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AuditExecutionTable from '@/components/AuditExecutionTable';

export const metadata = {
  title: 'Execute Audit - AssetFlow',
};

export default async function AuditExecutionPage({ params }) {
  const session = await auth();
  if (!session || !['ADMIN', 'ASSET_MANAGER'].includes(session.user.role)) {
    redirect('/admin/assets');
  }

  const { id } = await params;

  const audit = await prisma.auditCycle.findUnique({
    where: { id },
    include: {
      department: true,
      creator: true,
      items: {
        include: {
          asset: true
        }
      }
    }
  });

  if (!audit) {
    redirect('/admin/audits');
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/audits" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{audit.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Created by {audit.creator.name} on {new Date(audit.startDate).toLocaleDateString()}
            {audit.department && ` • Scope: ${audit.department.name}`}
          </p>
        </div>
        {audit.status === 'CLOSED' && (
          <span className="ml-auto inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-500/10">
            Closed on {new Date(audit.endDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <AuditExecutionTable audit={audit} />
    </div>
  );
}

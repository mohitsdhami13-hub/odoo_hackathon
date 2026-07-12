import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ExportCsvButton from '@/components/ExportCsvButton';

export const metadata = {
  title: 'Reports & Analytics - AssetFlow',
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session || !['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'].includes(session.user.role)) {
    redirect('/admin/assets');
  }

  // 1. Fetch data for CSV Export
  const assets = await prisma.asset.findMany({
    include: {
      category: true,
      allocations: {
        where: { status: 'ACTIVE' },
        include: { employee: { include: { department: true } }, department: true }
      }
    }
  });

  const exportData = assets.map(a => {
    const activeAlloc = a.allocations[0];
    const holder = activeAlloc 
      ? (activeAlloc.employee?.name || activeAlloc.department?.name)
      : 'None';
      
    return {
      AssetTag: a.assetTag,
      Name: a.name,
      Category: a.category.name,
      Status: a.status,
      Condition: a.condition || '',
      CurrentHolder: holder,
      Location: a.location || '',
      AcquisitionDate: a.acquisitionDate ? new Date(a.acquisitionDate).toISOString().split('T')[0] : '',
      AcquisitionCost: a.acquisitionCost || ''
    };
  });

  // 2. Compute Analytics: Utilization by Status
  const statusCounts = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {});

  const totalAssets = assets.length || 1; // avoid div by 0

  // 3. Compute Analytics: Department Allocation Summary
  const allocations = await prisma.allocation.findMany({
    where: { status: 'ACTIVE' },
    include: { employee: { include: { department: true } }, department: true }
  });

  const deptCounts = allocations.reduce((acc, alloc) => {
    const deptName = alloc.employee?.department?.name || alloc.department?.name || 'Unassigned';
    acc[deptName] = (acc[deptName] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500">Operational insights and utilization trends.</p>
        </div>
        <ExportCsvButton data={exportData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Asset Utilization Trends */}
        <div className="rounded-xl border border-slate-200 bg-[var(--color-white)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Asset Utilization Trends</h2>
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percentage = Math.round((count / totalAssets) * 100);
              let color = 'bg-slate-400';
              if (status === 'AVAILABLE') color = 'bg-emerald-500';
              if (status === 'ALLOCATED') color = 'bg-indigo-500';
              if (status === 'UNDER_MAINTENANCE') color = 'bg-amber-500';
              
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{status}</span>
                    <span className="text-slate-500">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Department Allocation Summary */}
        <div className="rounded-xl border border-slate-200 bg-[var(--color-white)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Active Allocations by Department</h2>
          <div className="space-y-4">
            {Object.entries(deptCounts).length === 0 ? (
              <p className="text-sm text-slate-500">No active allocations.</p>
            ) : (
              Object.entries(deptCounts)
                .sort((a, b) => b[1] - a[1]) // sort by count descending
                .map(([dept, count]) => {
                  const maxCount = Math.max(...Object.values(deptCounts));
                  const width = Math.round((count / maxCount) * 100);
                  
                  return (
                    <div key={dept} className="flex items-center gap-4">
                      <div className="w-1/3 text-sm font-medium text-slate-700 truncate">{dept}</div>
                      <div className="w-2/3 flex items-center gap-2">
                        <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                          <div className="h-full bg-indigo-200 border-r border-indigo-300" style={{ width: `${width}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500 w-6">{count}</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

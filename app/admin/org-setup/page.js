import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import OrgSetupTabs from '@/components/admin/OrgSetupTabs';

export const metadata = {
  title: 'Org setup — AssetFlow',
};

export default async function OrgSetupPage() {
  const session = await auth();

  // Defense in depth: middleware should already block non-admins from this
  // route, but the page checks again server-side rather than trusting only
  // the client-rendered tabs.
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Org setup</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage departments, asset categories, and the employee directory.
        </p>
      </div>
      <OrgSetupTabs />
    </div>
  );
}
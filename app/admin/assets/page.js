import { redirect } from 'next/navigation';
import { auth } from '@/auth';
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Assets</h1>
        <p className="mt-1 text-sm text-slate-500">
          {canRegister
            ? 'Register new assets and browse the full directory.'
            : 'Browse the asset directory.'}
        </p>
      </div>
      {canRegister && (
        <div className="mb-8">
          <AssetForm />
        </div>
      )}
      <AssetList />
    </div>
  );
}
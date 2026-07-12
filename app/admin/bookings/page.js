import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Bookings — AssetFlow' };

const STATUS_STYLES = {
  UPCOMING: 'bg-indigo-100 text-indigo-700',
  ONGOING: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-slate-200 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

function fmt(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default async function BookingsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  // Admins/Managers see all bookings; others see only their own
  const isPrivileged = ['ADMIN', 'ASSET_MANAGER'].includes(session.user.role);

  const bookings = await prisma.booking.findMany({
    where: isPrivileged ? {} : { bookedById: session.user.id },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      bookedBy: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  const upcoming = bookings.filter((b) => ['UPCOMING', 'ONGOING'].includes(b.status));
  const past = bookings.filter((b) => ['COMPLETED', 'CANCELLED'].includes(b.status));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isPrivileged ? 'All resource bookings across the organisation.' : 'Your bookings.'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Upcoming', value: bookings.filter((b) => b.status === 'UPCOMING').length, style: 'text-indigo-600' },
          { label: 'Ongoing', value: bookings.filter((b) => b.status === 'ONGOING').length, style: 'text-emerald-600' },
          { label: 'Completed', value: bookings.filter((b) => b.status === 'COMPLETED').length, style: 'text-slate-600' },
          { label: 'Cancelled', value: bookings.filter((b) => b.status === 'CANCELLED').length, style: 'text-red-600' },
        ].map(({ label, value, style }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${style}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming + Ongoing */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Upcoming &amp; Ongoing</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No upcoming bookings.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Asset</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Booked by</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Start</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">End</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcoming.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/assets/${b.asset.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {b.asset.name}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-slate-400">{b.asset.assetTag}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{b.bookedBy.name}</td>
                    <td className="px-4 py-3 text-slate-600">{fmt(b.startTime)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmt(b.endTime)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Past bookings</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Asset</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Booked by</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Start</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">End</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {past.map((b) => (
                  <tr key={b.id} className="opacity-70">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/assets/${b.asset.id}`}
                        className="font-medium text-slate-600 hover:underline"
                      >
                        {b.asset.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.bookedBy.name}</td>
                    <td className="px-4 py-3 text-slate-500">{fmt(b.startTime)}</td>
                    <td className="px-4 py-3 text-slate-500">{fmt(b.endTime)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {bookings.length === 0 && (
        <p className="text-sm text-slate-400 italic">No bookings yet. Book a bookable asset from its detail page.</p>
      )}
    </div>
  );
}

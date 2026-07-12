'use client';

import { useState } from 'react';
import { useBookings, useCreateBooking, useCancelBooking } from '@/lib/hooks/useBookings';

const STATUS_STYLES = {
  UPCOMING: 'bg-indigo-100 text-indigo-700',
  ONGOING: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-slate-200 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-600 line-through',
};

function fmt(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// Compact local datetime string for <input type="datetime-local">
function toLocalInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowPlusHours(h) {
  return toLocalInput(new Date(Date.now() + h * 3600_000));
}

export default function BookingPanel({ asset, userId }) {
  const { data: bookings, isLoading } = useBookings(asset.id);
  const createBooking = useCreateBooking(asset.id);
  const cancelBooking = useCancelBooking(asset.id);

  const [startTime, setStartTime] = useState(nowPlusHours(1));
  const [endTime, setEndTime] = useState(nowPlusHours(3));
  const [conflictMsg, setConflictMsg] = useState(null);

  if (!asset.isBookable) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Bookings</h2>
        <p className="text-sm text-slate-400 italic">This asset is not bookable.</p>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setConflictMsg(null);
    try {
      await createBooking.mutateAsync({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      // Reset to next available window
      setStartTime(nowPlusHours(1));
      setEndTime(nowPlusHours(3));
    } catch (err) {
      if (err.conflict) setConflictMsg(err.message);
    }
  };

  const onCancel = (bookingId) => {
    if (!confirm('Cancel this booking?')) return;
    cancelBooking.mutate(bookingId);
  };

  const upcoming = bookings?.filter((b) => ['UPCOMING', 'ONGOING'].includes(b.status)) ?? [];
  const past = bookings?.filter((b) => ['COMPLETED', 'CANCELLED'].includes(b.status)) ?? [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-5">
      <h2 className="text-base font-semibold text-slate-900">Book this asset</h2>

      {/* ── Booking form ──────────────────────────────────────────────── */}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="booking-start" className="block text-xs font-medium text-slate-500 mb-1">
              Start
            </label>
            <input
              id="booking-start"
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="booking-end" className="block text-xs font-medium text-slate-500 mb-1">
              End
            </label>
            <input
              id="booking-end"
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Conflict banner */}
        {conflictMsg && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{conflictMsg}</span>
          </div>
        )}

        {createBooking.isError && !createBooking.error?.conflict && (
          <p className="text-sm text-red-600">{createBooking.error.message}</p>
        )}

        <button
          id="booking-submit"
          type="submit"
          disabled={createBooking.isPending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
        >
          {createBooking.isPending ? 'Booking…' : 'Book slot'}
        </button>
      </form>

      {/* ── Upcoming / Ongoing ────────────────────────────────────────── */}
      {isLoading && <p className="text-sm text-slate-400">Loading bookings…</p>}

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Upcoming &amp; Ongoing
          </h3>
          <ul className="space-y-2">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{b.bookedBy?.name}</p>
                  <p className="text-xs text-slate-500">
                    {fmt(b.startTime)} → {fmt(b.endTime)}
                  </p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                {/* Cancel if owner or admin */}
                {(b.bookedById === userId || true) && b.status === 'UPCOMING' && (
                  <button
                    onClick={() => onCancel(b.id)}
                    disabled={cancelBooking.isPending}
                    className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {upcoming.length === 0 && !isLoading && (
        <p className="text-sm text-slate-400 italic">No upcoming bookings.</p>
      )}

      {/* ── Past bookings (collapsed) ─────────────────────────────────── */}
      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600 select-none">
            Past bookings ({past.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {past.map((b) => (
              <li
                key={b.id}
                className="flex items-start gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-slate-600 truncate">{b.bookedBy?.name}</p>
                  <p className="text-xs text-slate-400">
                    {fmt(b.startTime)} → {fmt(b.endTime)}
                  </p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      {cancelBooking.isError && (
        <p className="text-sm text-red-600">{cancelBooking.error.message}</p>
      )}
    </div>
  );
}

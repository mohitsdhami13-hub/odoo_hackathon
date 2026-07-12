'use client';

import { useState } from 'react';
import { useAssetMaintenance, useRaiseMaintenance, useResolveMaintenance } from '@/lib/hooks/useMaintenance';

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

// Available actions by current status
const ACTIONS = {
  PENDING: [
    { action: 'APPROVED', label: 'Approve', cls: 'bg-indigo-600 text-white hover:bg-indigo-500' },
    { action: 'REJECTED', label: 'Reject', cls: 'bg-red-600 text-white hover:bg-red-500' },
  ],
  APPROVED: [
    { action: 'RESOLVED', label: 'Mark Resolved', cls: 'bg-emerald-600 text-white hover:bg-emerald-500' },
  ],
  IN_PROGRESS: [
    { action: 'RESOLVED', label: 'Mark Resolved', cls: 'bg-emerald-600 text-white hover:bg-emerald-500' },
  ],
};

function inputCls() {
  return 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
}

export default function MaintenancePanel({ asset, userRole }) {
  const { data: requests, isLoading } = useAssetMaintenance(asset.id);
  const raise = useRaiseMaintenance(asset.id);
  const resolve = useResolveMaintenance();

  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [showForm, setShowForm] = useState(false);

  const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(userRole);

  const onSubmit = async (e) => {
    e.preventDefault();
    await raise.mutateAsync({ issue, priority });
    setIssue('');
    setPriority('MEDIUM');
    setShowForm(false);
  };

  const handleAction = (id, action) => {
    const labels = { APPROVED: 'Approve', REJECTED: 'Reject', RESOLVED: 'Mark as Resolved' };
    if (!confirm(`${labels[action]} this request?`)) return;
    resolve.mutate({ id, action });
  };

  const open = requests?.filter((r) => !['REJECTED', 'RESOLVED'].includes(r.status)) ?? [];
  const closed = requests?.filter((r) => ['REJECTED', 'RESOLVED'].includes(r.status)) ?? [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Maintenance</h2>
        {!showForm && (
          <button
            id="raise-maintenance-btn"
            onClick={() => setShowForm(true)}
            className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-400 transition-colors"
          >
            + Raise request
          </button>
        )}
      </div>

      {/* ── Raise form ────────────────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={onSubmit} className="space-y-3 rounded-md border border-orange-200 bg-orange-50 p-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Issue description</label>
            <textarea
              id="maintenance-issue"
              required
              minLength={5}
              rows={3}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe the problem…"
              className={inputCls() + ' resize-none'}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
            <select
              id="maintenance-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={inputCls()}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          {raise.isError && (
            <p className="text-sm text-red-600">{raise.error.message}</p>
          )}
          <div className="flex gap-2">
            <button
              id="maintenance-submit"
              type="submit"
              disabled={raise.isPending}
              className="flex-1 rounded-md bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-60 transition-colors"
            >
              {raise.isPending ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Open requests ─────────────────────────────────────────────── */}
      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}

      {open.length > 0 && (
        <ul className="space-y-3">
          {open.map((r) => (
            <li key={r.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-800 flex-1">{r.issue}</p>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[r.priority]}`}>
                    {r.priority}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Raised by {r.raisedBy?.name} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
              {/* Action buttons for managers */}
              {isManager && ACTIONS[r.status]?.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {ACTIONS[r.status].map(({ action, label, cls }) => (
                    <button
                      key={action}
                      onClick={() => handleAction(r.id, action)}
                      disabled={resolve.isPending}
                      className={`rounded px-2.5 py-1 text-xs font-medium disabled:opacity-60 transition-colors ${cls}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {resolve.isError && (
                <p className="text-xs text-red-600">{resolve.error.message}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {open.length === 0 && !isLoading && !showForm && (
        <p className="text-sm text-slate-400 italic">No open maintenance requests.</p>
      )}

      {/* ── Closed requests (collapsed) ───────────────────────────────── */}
      {closed.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600 select-none">
            Closed ({closed.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {closed.map((r) => (
              <li key={r.id} className="flex items-start gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm opacity-70">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-600 truncate">{r.issue}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.raisedBy?.name} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useEmployees } from '@/lib/hooks/useEmployees';
import { useDepartments } from '@/lib/hooks/useDepartments';
import {
  useAllocateAsset,
  useReturnAsset,
  useRequestTransfer,
  useTransfers,
  useResolveTransfer,
} from '@/lib/hooks/useAllocations';

const TRANSFER_STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

// ── small helpers ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function inputCls() {
  return 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
}

// ── AllocateForm ──────────────────────────────────────────────────────────────
function AllocateForm({ assetId, onConflict }) {
  const [target, setTarget] = useState('employee'); // 'employee' | 'department'
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');

  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();
  const allocate = useAllocateAsset(assetId);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await allocate.mutateAsync({
        employeeId: target === 'employee' ? employeeId : undefined,
        departmentId: target === 'department' ? departmentId : undefined,
        expectedReturnDate: expectedReturnDate || null,
      });
      setEmployeeId('');
      setDepartmentId('');
      setExpectedReturnDate('');
    } catch (err) {
      if (err.conflict) onConflict(err.message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Target type toggle */}
      <div className="flex gap-2">
        {['employee', 'department'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTarget(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              target === t
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t === 'employee' ? 'Employee' : 'Department'}
          </button>
        ))}
      </div>

      {target === 'employee' ? (
        <Field label="Assign to employee">
          <select
            id="alloc-employee"
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className={inputCls()}
          >
            <option value="">Select employee…</option>
            {employees
              ?.filter((e) => e.isActive)
              .map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.department?.name ?? 'No dept'}
                </option>
              ))}
          </select>
        </Field>
      ) : (
        <Field label="Assign to department">
          <select
            id="alloc-department"
            required
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className={inputCls()}
          >
            <option value="">Select department…</option>
            {departments
              ?.filter((d) => d.isActive)
              .map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
          </select>
        </Field>
      )}

      <Field label="Expected return date (optional)">
        <input
          id="alloc-return-date"
          type="date"
          value={expectedReturnDate}
          onChange={(e) => setExpectedReturnDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
          className={inputCls()}
        />
      </Field>

      <button
        id="allocate-submit"
        type="submit"
        disabled={allocate.isPending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
      >
        {allocate.isPending ? 'Allocating…' : 'Allocate asset'}
      </button>

      {allocate.isError && !allocate.error?.conflict && (
        <p className="text-sm text-red-600">{allocate.error.message}</p>
      )}
    </form>
  );
}

// ── TransferForm ──────────────────────────────────────────────────────────────
function TransferForm({ assetId }) {
  const [employeeId, setEmployeeId] = useState('');
  const { data: employees } = useEmployees();
  const requestTransfer = useRequestTransfer(assetId);

  const onSubmit = async (e) => {
    e.preventDefault();
    await requestTransfer.mutateAsync({ toEmployeeId: employeeId });
    setEmployeeId('');
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <Field label="Transfer to employee">
        <select
          id="transfer-employee"
          required
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className={inputCls()}
        >
          <option value="">Select employee…</option>
          {employees
            ?.filter((e) => e.isActive)
            .map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.department?.name ?? 'No dept'}
              </option>
            ))}
        </select>
      </Field>

      <button
        id="transfer-submit"
        type="submit"
        disabled={requestTransfer.isPending}
        className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-400 disabled:opacity-60 transition-colors"
      >
        {requestTransfer.isPending ? 'Sending request…' : 'Request transfer'}
      </button>

      {requestTransfer.isSuccess && (
        <p className="text-sm text-emerald-600">Transfer request created. Awaiting approval.</p>
      )}
      {requestTransfer.isError && (
        <p className="text-sm text-red-600">{requestTransfer.error.message}</p>
      )}
    </form>
  );
}

// ── ReturnPanel ───────────────────────────────────────────────────────────────
function ReturnPanel({ assetId, holderName, canWrite }) {
  const [condition, setCondition] = useState('');
  const returnAsset = useReturnAsset(assetId);

  if (!canWrite) return null;

  const onReturn = async () => {
    if (!confirm(`Return this asset from ${holderName}?`)) return;
    await returnAsset.mutateAsync({ conditionOnReturn: condition || undefined });
    setCondition('');
  };

  return (
    <div className="space-y-3">
      <Field label="Condition on return (optional)">
        <input
          id="return-condition"
          type="text"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="e.g. Good, Scratched"
          className={inputCls()}
        />
      </Field>
      <button
        id="return-submit"
        onClick={onReturn}
        disabled={returnAsset.isPending}
        className="w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-60 transition-colors"
      >
        {returnAsset.isPending ? 'Processing…' : `Return from ${holderName}`}
      </button>
      {returnAsset.isError && (
        <p className="text-sm text-red-600">{returnAsset.error.message}</p>
      )}
    </div>
  );
}

// ── TransferList ──────────────────────────────────────────────────────────────
function TransferList({ assetId, canWrite }) {
  const { data: transfers } = useTransfers(assetId);
  const resolveTransfer = useResolveTransfer(assetId);

  if (!transfers?.length) return null;

  const handle = (transferId, action) => {
    if (!confirm(`${action === 'APPROVED' ? 'Approve' : 'Reject'} this transfer?`)) return;
    resolveTransfer.mutate({ transferId, action });
  };

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-slate-700 mb-2">Transfer requests</h3>
      <ul className="space-y-2">
        {transfers.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <div className="space-y-0.5">
              <p className="text-slate-600 text-xs">
                {new Date(t.requestedAt).toLocaleDateString()}
              </p>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  TRANSFER_STATUS_STYLES[t.status]
                }`}
              >
                {t.status}
              </span>
            </div>
            {t.status === 'PENDING' && canWrite && (
              <div className="flex gap-2">
                <button
                  onClick={() => handle(t.id, 'APPROVED')}
                  disabled={resolveTransfer.isPending}
                  className="rounded px-2 py-1 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  onClick={() => handle(t.id, 'REJECTED')}
                  disabled={resolveTransfer.isPending}
                  className="rounded px-2 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-500 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {resolveTransfer.isError && (
        <p className="mt-1 text-sm text-red-600">{resolveTransfer.error.message}</p>
      )}
    </div>
  );
}

// ── Main AllocatePanel ────────────────────────────────────────────────────────
export default function AllocatePanel({ asset, userRole }) {
  const [conflictMessage, setConflictMessage] = useState(null);
  const [showTransferForm, setShowTransferForm] = useState(false);

  const canWrite = ['ADMIN', 'ASSET_MANAGER'].includes(userRole);
  const activeAllocation = asset.allocations?.find((a) => a.status === 'ACTIVE');
  const holderName =
    activeAllocation?.employee?.name ||
    activeAllocation?.department?.name ||
    'unknown';

  const isAllocated = asset.status === 'ALLOCATED';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <h2 className="text-base font-semibold text-slate-900">Allocation</h2>

      {/* ── Currently allocated ─────────────────────────────────────────── */}
      {isAllocated && activeAllocation && (
        <div className="rounded-md bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm">
          <p className="font-medium text-indigo-800">Currently held by</p>
          <p className="text-indigo-700 mt-0.5">{holderName}</p>
          {activeAllocation.expectedReturnDate && (
            <p className="text-indigo-600 text-xs mt-1">
              Expected return:{' '}
              {new Date(activeAllocation.expectedReturnDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* ── Conflict banner ──────────────────────────────────────────────── */}
      {conflictMessage && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <p className="font-medium">Allocation conflict</p>
          <p className="mt-0.5">{conflictMessage}</p>
          <button
            id="show-transfer-form-btn"
            onClick={() => { setConflictMessage(null); setShowTransferForm(true); }}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-400 transition-colors"
          >
            ↗ Request Transfer instead
          </button>
        </div>
      )}

      {/* ── Forms ───────────────────────────────────────────────────────── */}
      {canWrite && !isAllocated && !conflictMessage && !showTransferForm && (
        <AllocateForm assetId={asset.id} onConflict={(msg) => setConflictMessage(msg)} />
      )}

      {isAllocated && canWrite && !showTransferForm && (
        <div className="space-y-3">
          <ReturnPanel assetId={asset.id} holderName={holderName} canWrite={canWrite} />
          <button
            id="open-transfer-form-btn"
            onClick={() => setShowTransferForm(true)}
            className="w-full rounded-md border border-amber-400 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
          >
            Request transfer →
          </button>
        </div>
      )}

      {showTransferForm && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-slate-700">New transfer request</p>
            <button
              onClick={() => setShowTransferForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
          <TransferForm assetId={asset.id} />
        </div>
      )}

      {!canWrite && !isAllocated && (
        <p className="text-sm text-slate-400 italic">This asset is available.</p>
      )}

      {/* ── Transfer request list ────────────────────────────────────────── */}
      <TransferList assetId={asset.id} canWrite={canWrite} />
    </div>
  );
}

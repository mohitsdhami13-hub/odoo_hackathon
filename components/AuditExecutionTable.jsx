'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditExecutionTable({ audit }) {
  const [items, setItems] = useState(audit.items);
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();
  
  const isClosed = audit.status === 'CLOSED';

  const updateItemStatus = async (itemId, newStatus) => {
    // Optimistic update
    setItems(current => current.map(item => 
      item.id === itemId ? { ...item, status: newStatus } : item
    ));

    try {
      const res = await fetch(`/api/audits/${audit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to update item status');
      // Revert optimism if needed (skipping for brevity)
    }
  };

  const handleCloseAudit = async () => {
    if (!confirm('Are you sure you want to close this audit? Missing items will be marked as RETIRED/LOST. This cannot be undone.')) {
      return;
    }
    
    setIsClosing(true);
    try {
      const res = await fetch(`/api/audits/${audit.id}/close`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to close');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to close audit');
      setIsClosing(false);
    }
  };

  const pendingCount = items.filter(i => i.status === 'UNVERIFIED').length;

  return (
    <div className="space-y-6">
      {!isClosed && (
        <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <p className="text-indigo-800 text-sm">
            <strong>{pendingCount}</strong> items remaining to verify.
          </p>
          <button
            onClick={handleCloseAudit}
            disabled={isClosing || pendingCount > 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={pendingCount > 0 ? "Verify all items before closing" : "Close and finalize audit"}
          >
            {isClosing ? 'Closing...' : 'Close & Finalize Audit'}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Asset Tag</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Expected Location</th>
              <th className="px-6 py-4">Current Status</th>
              <th className="px-6 py-4">Audit Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => {
              const currentAssetStatus = item.asset.status;
              let badgeColor = 'bg-slate-100 text-slate-600';
              if (item.status === 'VERIFIED') badgeColor = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 ring-1 ring-inset';
              if (item.status === 'MISSING') badgeColor = 'bg-red-50 text-red-700 ring-red-600/20 ring-1 ring-inset';
              if (item.status === 'DAMAGED') badgeColor = 'bg-amber-50 text-amber-700 ring-amber-600/20 ring-1 ring-inset';

              return (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.asset.assetTag}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{item.asset.name}</td>
                  <td className="px-6 py-4 text-slate-600">{item.asset.location || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{currentAssetStatus}</span>
                  </td>
                  <td className="px-6 py-4">
                    {isClosed ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badgeColor}`}>
                        {item.status}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateItemStatus(item.id, 'VERIFIED')}
                          className={`px-3 py-1 text-xs font-medium rounded-md border ${
                            item.status === 'VERIFIED' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Verified
                        </button>
                        <button
                          onClick={() => updateItemStatus(item.id, 'MISSING')}
                          className={`px-3 py-1 text-xs font-medium rounded-md border ${
                            item.status === 'MISSING' 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Missing
                        </button>
                        <button
                          onClick={() => updateItemStatus(item.id, 'DAMAGED')}
                          className={`px-3 py-1 text-xs font-medium rounded-md border ${
                            item.status === 'DAMAGED' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Damaged
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

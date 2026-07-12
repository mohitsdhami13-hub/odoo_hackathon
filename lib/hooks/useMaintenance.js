'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── List for one asset ────────────────────────────────────────────────────────
export function useAssetMaintenance(assetId) {
  return useQuery({
    queryKey: ['maintenance', 'asset', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/assets/${assetId}/maintenance`);
      if (!res.ok) throw new Error('Failed to load maintenance requests');
      return (await res.json()).data;
    },
    enabled: !!assetId,
    refetchInterval: 30000,
  });
}

// ── Org-wide list ─────────────────────────────────────────────────────────────
export function useMaintenance(status = '') {
  return useQuery({
    queryKey: ['maintenance', 'all', status],
    queryFn: async () => {
      const qs = status ? `?status=${status}` : '';
      const res = await fetch(`/api/maintenance${qs}`);
      if (!res.ok) throw new Error('Failed to load maintenance requests');
      return (await res.json()).data;
    },
    refetchInterval: 30000,
  });
}

// ── Raise a request ───────────────────────────────────────────────────────────
export function useRaiseMaintenance(assetId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/assets/${assetId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to raise maintenance request');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

// ── Approve / Reject / Resolve ────────────────────────────────────────────────
export function useResolveMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }) => {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

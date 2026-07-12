'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── Allocate ──────────────────────────────────────────────────────────────────
export function useAllocateAsset(assetId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/assets/${assetId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Failed to allocate asset');
        err.conflict = data.conflict ?? false;
        err.status = res.status;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

// ── Return ────────────────────────────────────────────────────────────────────
export function useReturnAsset(assetId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload = {}) => {
      const res = await fetch(`/api/assets/${assetId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to return asset');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

// ── Transfer Request ──────────────────────────────────────────────────────────
export function useRequestTransfer(assetId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/assets/${assetId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create transfer request');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['transfers', assetId] });
    },
  });
}

// ── Transfer List ─────────────────────────────────────────────────────────────
export function useTransfers(assetId) {
  return useQuery({
    queryKey: ['transfers', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/assets/${assetId}/transfer`);
      if (!res.ok) throw new Error('Failed to load transfers');
      const json = await res.json();
      return json.data;
    },
    enabled: !!assetId,
  });
}

// ── Approve / Reject Transfer ─────────────────────────────────────────────────
export function useResolveTransfer(assetId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ transferId, action }) => {
      const res = await fetch(`/api/admin/transfers/${transferId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve transfer');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['transfers', assetId] });
    },
  });
}

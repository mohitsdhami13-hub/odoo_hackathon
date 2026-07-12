'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchAssets(filters) {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  const res = await fetch(`/api/assets${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to load assets');
  const json = await res.json();
  return json.data;
}

export function useAssets(filters = {}) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => fetchAssets(filters),
    refetchInterval: 15000,
  });
}

async function fetchAsset(id) {
  const res = await fetch(`/api/assets/${id}`);
  if (!res.ok) throw new Error('Failed to load asset');
  const json = await res.json();
  return json.data;
}

export function useAsset(id) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => fetchAsset(id),
    enabled: !!id,
    refetchInterval: 15000,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create asset');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update asset');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] }),
  });
}
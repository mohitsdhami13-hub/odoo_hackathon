'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchAssetCategories() {
  const res = await fetch('/api/admin/categories');
  if (!res.ok) throw new Error('Failed to load asset categories');
  const json = await res.json();
  return json.data;
}

export function useAssetCategories() {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: fetchAssetCategories,
    refetchInterval: 15000,
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset-categories'] }),
  });
}

export function useDeleteAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset-categories'] }),
  });
}
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchDepartments(activeOnly) {
  const res = await fetch(`/api/admin/departments${activeOnly ? '?active=true' : ''}`);
  if (!res.ok) throw new Error('Failed to load departments');
  const json = await res.json();
  return json.data;
}

export function useDepartments(activeOnly = false) {
  return useQuery({
    queryKey: ['departments', { activeOnly }],
    queryFn: () => fetchDepartments(activeOnly),
    refetchInterval: 15000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create department');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update department');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
}
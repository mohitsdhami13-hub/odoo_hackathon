'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function fetchEmployees() {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error('Failed to load employees');
  return res.json();
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    refetchInterval: 15000,
  });
}

export function usePromoteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }) => {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useAssignDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, departmentId }) => {
      const res = await fetch(`/api/admin/users/${id}/department`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update department');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}
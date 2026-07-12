'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── Fetch bookings for one asset ──────────────────────────────────────────────
export function useBookings(assetId) {
  return useQuery({
    queryKey: ['bookings', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/assets/${assetId}/bookings`);
      if (!res.ok) throw new Error('Failed to load bookings');
      const json = await res.json();
      return json.data;
    },
    enabled: !!assetId,
    refetchInterval: 30000,
  });
}

// ── Create a booking ──────────────────────────────────────────────────────────
export function useCreateBooking(assetId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/assets/${assetId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || 'Failed to create booking');
        err.conflict = data.conflict ?? false;
        err.status = res.status;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', assetId] });
    },
  });
}

// ── Cancel a booking ──────────────────────────────────────────────────────────
export function useCancelBooking(assetId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId) => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', assetId] });
    },
  });
}

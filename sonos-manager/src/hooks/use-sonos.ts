'use client';

/**
 * React hook for Sonos API interactions using React Query.
 * Provides caching, automatic refetching, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getZones,
  play,
  pause,
  playPause,
  next,
  previous,
  setVolume,
  setGroupVolume,
  mute,
  unmute,
  toggleMute,
  joinGroup,
  leaveGroup,
  pauseAll,
  resumeAll,
  transformZonesToDevices,
  transformZonesToZoneStatuses,
} from '@/lib/sonos-api';
import type { DeviceStatus, ZoneStatus } from '@/types/sonos';

// Query keys for cache management
export const sonosQueryKeys = {
  zones: ['zones'] as const,
  devices: ['devices'] as const,
  zoneStatuses: ['zoneStatuses'] as const,
};

// Default polling interval for real-time updates (2 seconds)
const DEFAULT_REFETCH_INTERVAL = 2000;

/**
 * Hook to fetch all zones with their devices
 */
export function useZones(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: sonosQueryKeys.zones,
    queryFn: getZones,
    refetchInterval: options?.refetchInterval ?? DEFAULT_REFETCH_INTERVAL,
    staleTime: 1000, // Consider data stale after 1 second
  });
}

/**
 * Hook to get devices as a flat list
 */
export function useDevices(options?: { refetchInterval?: number }): {
  devices: DeviceStatus[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data: zones, isLoading, isError, error, refetch } = useZones(options);

  return {
    devices: zones ? transformZonesToDevices(zones) : [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook to get zone statuses
 */
export function useZoneStatuses(options?: { refetchInterval?: number }): {
  zoneStatuses: ZoneStatus[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data: zones, isLoading, isError, error, refetch } = useZones(options);

  return {
    zoneStatuses: zones ? transformZonesToZoneStatuses(zones) : [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for play mutation
 */
export function usePlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => play(roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for pause mutation
 */
export function usePause() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => pause(roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for play/pause toggle mutation
 */
export function usePlayPause() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => playPause(roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for next track mutation
 */
export function useNext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => next(roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for previous track mutation
 */
export function usePrevious() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => previous(roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for volume control with optimistic updates
 */
export function useVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomName, volume }: { roomName: string; volume: number }) =>
      setVolume(roomName, volume),
    // Optimistic update for instant feedback
    onMutate: async ({ roomName, volume }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: sonosQueryKeys.zones });

      // Snapshot current value
      const previousZones = queryClient.getQueryData(sonosQueryKeys.zones);

      // Optimistically update the cache
      queryClient.setQueryData(sonosQueryKeys.zones, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((zone: { coordinator: { roomName: string; state: { volume: number } }; members: { roomName: string; state: { volume: number } }[] }) => ({
          ...zone,
          coordinator:
            zone.coordinator.roomName === roomName
              ? { ...zone.coordinator, state: { ...zone.coordinator.state, volume } }
              : zone.coordinator,
          members: zone.members.map((member: { roomName: string; state: { volume: number } }) =>
            member.roomName === roomName
              ? { ...member, state: { ...member.state, volume } }
              : member
          ),
        }));
      });

      return { previousZones };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousZones) {
        queryClient.setQueryData(sonosQueryKeys.zones, context.previousZones);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for group volume control
 */
export function useGroupVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomName, volume }: { roomName: string; volume: number }) =>
      setGroupVolume(roomName, volume),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for mute mutation
 */
export function useMute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => mute(roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for unmute mutation
 */
export function useUnmute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => unmute(roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for toggle mute mutation
 */
export function useToggleMute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => toggleMute(roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for joining a group
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomName, targetRoom }: { roomName: string; targetRoom: string }) =>
      joinGroup(roomName, targetRoom),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for leaving a group
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomName: string) => leaveGroup(roomName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for pausing all zones
 */
export function usePauseAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

/**
 * Hook for resuming all zones
 */
export function useResumeAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

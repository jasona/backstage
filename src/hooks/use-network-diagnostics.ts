'use client';

/**
 * React Query hooks for network diagnostics.
 * Provides caching and automatic refetching for diagnostics data.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getNetworkDiagnostics,
  calculateNetworkHealth,
} from '@/lib/network-diagnostics-api';
import type { NetworkTopology, NetworkHealthSummary } from '@/types/sonos';

// Query key for cache management
export const networkDiagnosticsQueryKey = ['networkDiagnostics'] as const;

// Default refetch interval (30 seconds - diagnostics don't need frequent updates)
const DEFAULT_REFETCH_INTERVAL = 30000;

/**
 * Hook to fetch network diagnostics topology
 */
export function useNetworkDiagnostics(options?: { refetchInterval?: number }) {
  return useQuery<NetworkTopology>({
    queryKey: networkDiagnosticsQueryKey,
    queryFn: getNetworkDiagnostics,
    refetchInterval: options?.refetchInterval ?? DEFAULT_REFETCH_INTERVAL,
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 2, // Retry failed requests twice
  });
}

/**
 * Hook to get network health summary
 * Derives health from the topology data
 */
export function useNetworkHealth(options?: { refetchInterval?: number }): {
  health: NetworkHealthSummary | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data: topology, isLoading, isError, error, refetch } = useNetworkDiagnostics(options);

  return {
    health: topology ? calculateNetworkHealth(topology) : null,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook to get diagnostics for a specific device
 */
export function useDeviceNetworkDiagnostics(
  deviceId: string,
  options?: { refetchInterval?: number }
) {
  const { data: topology, isLoading, isError, error, refetch } = useNetworkDiagnostics(options);

  const device = topology?.devices.find(d => d.deviceId === deviceId);

  return {
    device,
    topology,
    isLoading,
    isError,
    error,
    refetch,
  };
}

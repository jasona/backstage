'use client';

/**
 * React hooks for Sonos favorites using React Query.
 * Provides fetching and playing favorites with caching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFavorites, playFavorite } from '@/lib/favorites-api';
import { sonosQueryKeys } from '@/hooks/use-sonos';

// Query keys for favorites cache management
export const favoritesQueryKeys = {
  favorites: (roomName: string) => ['favorites', roomName] as const,
};

/**
 * Hook to fetch favorites for a room
 */
export function useFavorites(roomName: string | null) {
  return useQuery({
    queryKey: favoritesQueryKeys.favorites(roomName ?? ''),
    queryFn: () => getFavorites(roomName!),
    enabled: !!roomName,
    staleTime: 60000, // Consider favorites stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook for playing a favorite
 */
export function usePlayFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomName, favoriteName }: { roomName: string; favoriteName: string }) =>
      playFavorite(roomName, favoriteName),
    onSuccess: () => {
      // Invalidate zones to refresh playback state
      queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
    },
  });
}

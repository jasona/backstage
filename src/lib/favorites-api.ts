/**
 * Favorites API client for Sonos favorites endpoints.
 * Handles fetching and playing Sonos favorites (playlists, radio stations, albums).
 */

import { z } from 'zod';

const API_BASE_URL = '/api/sonos';

/**
 * Favorite item (normalized from API response)
 */
export interface Favorite {
  title: string;
}

/**
 * Schema for the favorites response
 * node-sonos-http-api returns a simple array of favorite names (strings)
 */
export const FavoritesResponseSchema = z.array(z.string());

/**
 * Custom error class for favorites API errors
 */
export class FavoritesApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'FavoritesApiError';
  }
}

/**
 * Make an API request to the Sonos backend
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new FavoritesApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        endpoint
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof FavoritesApiError) {
      throw error;
    }
    throw new FavoritesApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      endpoint
    );
  }
}

/**
 * Get list of Sonos favorites for a room
 */
export async function getFavorites(roomName: string): Promise<Favorite[]> {
  const data = await apiRequest<unknown>(`/${encodeURIComponent(roomName)}/favorites`);
  const result = FavoritesResponseSchema.safeParse(data);

  if (!result.success) {
    console.error('Favorites data validation error:', result.error);
    // Return empty array on validation failure
    return [];
  }

  // Transform array of strings into Favorite objects
  return result.data.map((title) => ({ title }));
}

/**
 * Play a favorite by name
 */
export async function playFavorite(roomName: string, favoriteName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/favorite/${encodeURIComponent(favoriteName)}`);
}

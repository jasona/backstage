/**
 * Sonos API client for communicating with node-sonos-http-api backend.
 * All API calls are made through this module.
 */

import { z } from 'zod';
import type {
  SonosZone,
  ZonesResponse,
  DeviceStatus,
  ZoneStatus,
  PlaybackState,
} from '@/types/sonos';

// Base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_SONOS_API_URL || 'http://localhost:5005';

// Zod schemas for response validation
export const NowPlayingSchema = z.object({
  artist: z.string().default(''),
  title: z.string().default(''),
  album: z.string().default(''),
  albumArtUri: z.string().optional(),
  duration: z.number().default(0),
  position: z.number().default(0),
  type: z.string().default(''),
  stationName: z.string().optional(),
});

export const PlayModeSchema = z.object({
  repeat: z.enum(['none', 'one', 'all']).default('none'),
  shuffle: z.boolean().default(false),
  crossfade: z.boolean().default(false),
});

export const DeviceStateSchema = z.object({
  volume: z.number().default(0),
  mute: z.boolean().default(false),
  currentTrack: NowPlayingSchema.optional(),
  playbackState: z.enum(['PLAYING', 'PAUSED_PLAYBACK', 'STOPPED', 'TRANSITIONING']).default('STOPPED'),
  playMode: PlayModeSchema.optional(),
});

export const GroupStateSchema = z.object({
  volume: z.number().default(0),
  mute: z.boolean().default(false),
});

export const SonosDeviceSchema = z.object({
  uuid: z.string(),
  roomName: z.string(),
  coordinator: z.boolean().default(false),
  groupState: GroupStateSchema.optional(),
  state: DeviceStateSchema.optional(),
});

export const SonosZoneSchema = z.object({
  uuid: z.string(),
  coordinator: SonosDeviceSchema,
  members: z.array(SonosDeviceSchema).default([]),
});

export const ZonesResponseSchema = z.array(SonosZoneSchema);

/**
 * Custom error class for API errors
 */
export class SonosApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'SonosApiError';
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
      throw new SonosApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        endpoint
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof SonosApiError) {
      throw error;
    }
    throw new SonosApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      endpoint
    );
  }
}

/**
 * Get all zones with their devices and current state
 */
export async function getZones(): Promise<ZonesResponse> {
  const data = await apiRequest<unknown>('/zones');
  const result = ZonesResponseSchema.safeParse(data);

  if (!result.success) {
    console.error('Zone data validation error:', result.error);
    // Return empty array on validation failure to avoid breaking the UI
    return [];
  }

  return result.data;
}

/**
 * Transform zones response into a flat list of device statuses
 */
export function transformZonesToDevices(zones: ZonesResponse): DeviceStatus[] {
  const devices: DeviceStatus[] = [];

  for (const zone of zones) {
    const coordState = zone.coordinator.state;
    // Add coordinator
    devices.push({
      id: zone.coordinator.uuid,
      roomName: zone.coordinator.roomName,
      modelName: 'Sonos', // Model info not in zones response
      ipAddress: '', // IP not in zones response
      isCoordinator: true,
      groupId: zone.uuid,
      volume: coordState?.volume ?? 0,
      muted: coordState?.mute ?? false,
      playbackState: (coordState?.playbackState ?? 'STOPPED') as PlaybackState,
      nowPlaying: coordState?.currentTrack?.title
        ? coordState.currentTrack
        : undefined,
    });

    // Add members (excluding coordinator)
    for (const member of zone.members) {
      if (member.uuid !== zone.coordinator.uuid) {
        const memberState = member.state;
        devices.push({
          id: member.uuid,
          roomName: member.roomName,
          modelName: 'Sonos',
          ipAddress: '',
          isCoordinator: false,
          groupId: zone.uuid,
          volume: memberState?.volume ?? 0,
          muted: memberState?.mute ?? false,
          playbackState: (memberState?.playbackState ?? 'STOPPED') as PlaybackState,
          nowPlaying: memberState?.currentTrack?.title
            ? memberState.currentTrack
            : undefined,
        });
      }
    }
  }

  return devices;
}

/**
 * Transform zones response into zone statuses
 */
export function transformZonesToZoneStatuses(zones: ZonesResponse): ZoneStatus[] {
  return zones.map((zone) => {
    const coordState = zone.coordinator.state;
    const groupState = zone.coordinator.groupState;
    return {
      id: zone.uuid,
      coordinatorId: zone.coordinator.uuid,
      coordinatorRoom: zone.coordinator.roomName,
      memberIds: zone.members.map((m) => m.uuid),
      memberRooms: zone.members.map((m) => m.roomName),
      volume: groupState?.volume ?? 0,
      muted: groupState?.mute ?? false,
      playbackState: (coordState?.playbackState ?? 'STOPPED') as PlaybackState,
      nowPlaying: coordState?.currentTrack?.title
        ? coordState.currentTrack
        : undefined,
    };
  });
}

/**
 * Start playback on a room
 */
export async function play(roomName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/play`);
}

/**
 * Pause playback on a room
 */
export async function pause(roomName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/pause`);
}

/**
 * Toggle play/pause on a room
 */
export async function playPause(roomName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/playpause`);
}

/**
 * Skip to next track on a room
 */
export async function next(roomName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/next`);
}

/**
 * Skip to previous track on a room
 */
export async function previous(roomName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/previous`);
}

/**
 * Set volume on a room (0-100)
 */
export async function setVolume(roomName: string, volume: number): Promise<void> {
  const clampedVolume = Math.max(0, Math.min(100, Math.round(volume)));
  await apiRequest(`/${encodeURIComponent(roomName)}/volume/${clampedVolume}`);
}

/**
 * Set group volume (0-100)
 */
export async function setGroupVolume(roomName: string, volume: number): Promise<void> {
  const clampedVolume = Math.max(0, Math.min(100, Math.round(volume)));
  await apiRequest(`/${encodeURIComponent(roomName)}/groupVolume/${clampedVolume}`);
}

/**
 * Mute a room
 */
export async function mute(roomName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/mute`);
}

/**
 * Unmute a room
 */
export async function unmute(roomName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/unmute`);
}

/**
 * Toggle mute on a room
 */
export async function toggleMute(roomName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/togglemute`);
}

/**
 * Join a room to another room's group
 */
export async function joinGroup(roomName: string, targetRoom: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/join/${encodeURIComponent(targetRoom)}`);
}

/**
 * Remove a room from its current group
 */
export async function leaveGroup(roomName: string): Promise<void> {
  await apiRequest(`/${encodeURIComponent(roomName)}/leave`);
}

/**
 * Pause all zones
 */
export async function pauseAll(): Promise<void> {
  await apiRequest('/pauseall');
}

/**
 * Resume all previously playing zones
 */
export async function resumeAll(): Promise<void> {
  await apiRequest('/resumeall');
}

/**
 * Get the current state of a specific room
 */
export async function getRoomState(roomName: string): Promise<SonosZone | undefined> {
  const zones = await getZones();
  return zones.find(
    (zone) =>
      zone.coordinator.roomName.toLowerCase() === roomName.toLowerCase() ||
      zone.members.some((m) => m.roomName.toLowerCase() === roomName.toLowerCase())
  );
}

/**
 * Check if the API is reachable
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await getZones();
    return true;
  } catch {
    return false;
  }
}

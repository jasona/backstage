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

// Use the proxy route to avoid CORS and localhost issues when accessing from other machines
// The proxy forwards requests to the actual node-sonos-http-api server
const API_BASE_URL = '/api/sonos';

// Zod schemas for response validation
export const NowPlayingSchema = z.object({
  artist: z.string().default(''),
  title: z.string().default(''),
  album: z.string().default(''),
  albumArtUri: z.string().optional(),
  absoluteAlbumArtUri: z.string().optional(), // Full URL with Sonos speaker IP
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

// CACHE_BUST_20240125
export const SonosDeviceSchema = z.object({
  uuid: z.string(),
  roomName: z.string(),
  coordinator: z.string(), // UUID of the coordinator device (NOT a boolean!)
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
 * Get the current playback position for a room
 * Returns elapsed time in seconds, or 0 if unavailable
 */
export async function getPlaybackPosition(roomName: string): Promise<number> {
  try {
    const response = await apiRequest<unknown>(`/${encodeURIComponent(roomName)}/state`);
    if (response && typeof response === 'object') {
      const data = response as Record<string, unknown>;
      return typeof data.elapsedTime === 'number' ? data.elapsedTime : 0;
    }
    return 0;
  } catch {
    return 0;
  }
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

// Diagnostic API functions

/**
 * Device diagnostic info schema
 */
export const DeviceDiagnosticSchema = z.object({
  softwareVersion: z.string().optional(),
  hardwareVersion: z.string().optional(),
  serialNumber: z.string().optional(),
  macAddress: z.string().optional(),
  ipAddress: z.string().optional(),
  modelNumber: z.string().optional(),
  modelName: z.string().optional(),
  displayName: z.string().optional(),
});

export type DeviceDiagnostic = z.infer<typeof DeviceDiagnosticSchema>;

/**
 * Get detailed device information from a room
 * Note: node-sonos-http-api provides this via /<roomName>/state endpoint
 */
export async function getDeviceInfo(roomName: string): Promise<DeviceDiagnostic> {
  try {
    const response = await apiRequest<unknown>(`/${encodeURIComponent(roomName)}/state`);
    // The state endpoint returns various info - we extract what we can
    if (response && typeof response === 'object') {
      const data = response as Record<string, unknown>;
      return {
        softwareVersion: data.softwareVersion as string | undefined,
        hardwareVersion: data.hardwareVersion as string | undefined,
        serialNumber: data.serialNum as string | undefined,
        macAddress: data.macAddress as string | undefined,
        ipAddress: data.ipAddress as string | undefined,
        modelNumber: data.modelNumber as string | undefined,
        modelName: data.modelName as string | undefined,
        displayName: data.roomName as string | undefined,
      };
    }
    return {};
  } catch {
    // Return empty object if state endpoint fails
    return {};
  }
}

/**
 * Reboot a Sonos device
 * Note: This requires direct access to the device's web interface
 * at http://<device-ip>:1400/reboot which may need authentication
 */
export async function rebootDevice(roomName: string): Promise<void> {
  // node-sonos-http-api doesn't have a built-in reboot endpoint
  // This would need to be implemented via direct device access
  // For now, we throw an error indicating it's not supported
  throw new SonosApiError(
    'Device reboot is not supported through the current API. ' +
    'You can reboot devices manually through the Sonos app or device web interface.',
    501,
    `/${roomName}/reboot`
  );
}

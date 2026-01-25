/**
 * Sonos device and zone types for the Sonos Manager application.
 * These types correspond to the node-sonos-http-api response formats.
 */

/** Playback state of a Sonos device */
export type PlaybackState = 'PLAYING' | 'PAUSED_PLAYBACK' | 'STOPPED' | 'TRANSITIONING';

/** Information about the currently playing track */
export interface NowPlaying {
  artist: string;
  title: string;
  album: string;
  albumArtUri?: string;
  duration: number;
  position: number;
  type: string;
  stationName?: string;
}

/** A single Sonos device/speaker */
export interface SonosDevice {
  uuid: string;
  roomName: string;
  coordinator: boolean;
  groupState?: {
    volume: number;
    mute: boolean;
  };
  state?: {
    volume: number;
    mute: boolean;
    currentTrack?: NowPlaying;
    playbackState: PlaybackState;
    playMode?: {
      repeat: 'none' | 'one' | 'all';
      shuffle: boolean;
      crossfade: boolean;
    };
  };
}

/** A zone/group of Sonos devices */
export interface SonosZone {
  uuid: string;
  coordinator: SonosDevice;
  members: SonosDevice[];
}

/** Device info from /status/info endpoint */
export interface SonosDeviceInfo {
  playerId: string;
  serialNumber: string;
  householdId: string;
  groupId: string;
  modelNumber: string;
  modelName: string;
  softwareVersion: string;
  hardwareVersion: string;
  ipAddress: string;
  macAddress: string;
  roomName: string;
}

/** Simplified device representation for the dashboard */
export interface DeviceStatus {
  id: string;
  roomName: string;
  modelName: string;
  ipAddress: string;
  isCoordinator: boolean;
  groupId: string;
  volume: number;
  muted: boolean;
  playbackState: PlaybackState;
  nowPlaying?: NowPlaying;
}

/** Zone/group representation for the dashboard */
export interface ZoneStatus {
  id: string;
  coordinatorId: string;
  coordinatorRoom: string;
  memberIds: string[];
  memberRooms: string[];
  volume: number;
  muted: boolean;
  playbackState: PlaybackState;
  nowPlaying?: NowPlaying;
}

/** API response from /zones endpoint */
export type ZonesResponse = SonosZone[];

/** Standard API error response */
export interface ApiError {
  error: string;
  message: string;
}

/** Volume change request */
export interface VolumeRequest {
  roomName: string;
  volume: number;
}

/** Grouping request */
export interface GroupRequest {
  roomName: string;
  targetRoom: string;
}

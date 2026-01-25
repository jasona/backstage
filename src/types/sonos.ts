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
  coordinator: string; // UUID of the coordinator device
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

// ============================================
// Network Diagnostics Types
// ============================================

/** Connection type for a Sonos device */
export type NetworkConnectionType = 'sonosnet' | 'wifi' | 'ethernet' | 'unknown';

/** Signal quality levels */
export type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

/** Network diagnostics for a single device */
export interface DeviceNetworkDiagnostics {
  deviceId: string;
  roomName: string;
  ipAddress: string;
  macAddress: string;
  connectionType: NetworkConnectionType;
  isWired: boolean;
  snr?: number;
  signalQuality: SignalQuality;
  isReachable: boolean;
  lastSeen: string;
  modelNumber: string;
  softwareVersion: string;
  supportsSonosNet: boolean;
}

/** Network topology of all devices */
export interface NetworkTopology {
  devices: DeviceNetworkDiagnostics[];
  hasSonosNet: boolean;
  wiredDeviceIds: string[];
  lastUpdated: string;
}

/** Summary of network health */
export interface NetworkHealthSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  sonosNetDevices: number;
  wifiDevices: number;
  wiredDevices: number;
  poorSignalDevices: string[];
  hasSonosNet: boolean;
  overallHealth: 'healthy' | 'warning' | 'critical';
  issues: NetworkIssue[];
}

/** A detected network issue */
export interface NetworkIssue {
  severity: 'info' | 'warning' | 'critical';
  roomName?: string;
  type: 'weak_signal' | 'device_offline' | 'wifi_only' | 'no_sonosnet';
  message: string;
  recommendation: string;
}

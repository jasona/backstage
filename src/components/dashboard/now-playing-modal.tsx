'use client';

/**
 * Now Playing modal that displays album art, track info, and music controls.
 * Opens when clicking on the song name in Dashboard or Groups screens.
 * Shows grouped devices with individual volume controls when playing on multiple speakers.
 */

import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  useDevices,
  useZoneStatuses,
  usePlayPause,
  useNext,
  usePrevious,
  useVolume,
  useGroupVolume,
  useToggleMute,
} from '@/hooks/use-sonos';
import { getPlaybackPosition } from '@/lib/sonos-api';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc3,
  Radio,
  Loader2,
  Speaker,
  Crown,
} from 'lucide-react';
import type { DeviceStatus } from '@/types/sonos';

const VOLUME_DEBOUNCE_MS = 100;

interface NowPlayingModalProps {
  roomName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Format seconds to mm:ss display
 */
function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get proxied album art URL to avoid mixed content issues
 * Uses base64 encoding to avoid URL encoding issues with special characters
 */
function getProxiedAlbumArtUrl(url: string | undefined, roomName: string): string | undefined {
  if (!url) return undefined;

  // HTTPS URLs can be used directly (no mixed content issue)
  if (url.startsWith('https://')) {
    return url;
  }

  // Relative paths and HTTP URLs need to go through our proxy
  // Use base64 encoding to avoid double-encoding issues
  const encoded = btoa(url);
  // Include room name for /getaa requests which need it
  return `/api/albumart?b64=${encoded}&room=${encodeURIComponent(roomName)}`;
}

/**
 * Individual device volume control for grouped devices - vertical layout
 */
function DeviceVolumeControl({
  device,
  isCoordinator,
  onVolumeChange,
  onToggleMute,
}: {
  device: DeviceStatus;
  isCoordinator: boolean;
  onVolumeChange: (roomName: string, volume: number) => void;
  onToggleMute: (roomName: string) => void;
}) {
  const [localVolume, setLocalVolume] = useState(device.volume);
  const [isDragging, setIsDragging] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isDragging) {
      setLocalVolume(device.volume);
    }
  }, [device.volume, isDragging]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0];
      setLocalVolume(newVolume);
      setIsDragging(true);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onVolumeChange(device.roomName, newVolume);
        setIsDragging(false);
      }, VOLUME_DEBOUNCE_MS);
    },
    [device.roomName, onVolumeChange]
  );

  const handleToggleMute = useCallback(() => {
    onToggleMute(device.roomName);
  }, [device.roomName, onToggleMute]);

  return (
    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {isCoordinator ? (
            <Crown className="w-3 h-3 text-primary flex-shrink-0" />
          ) : (
            <Speaker className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-xs font-medium text-foreground truncate">{device.roomName}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={handleToggleMute}
          >
            {device.muted ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </Button>
          <span className="text-xs text-muted-foreground w-7 text-right">
            {localVolume}%
          </span>
        </div>
      </div>
      <Slider
        value={[device.muted ? 0 : localVolume]}
        max={100}
        step={1}
        onValueChange={handleVolumeChange}
        className="w-full"
      />
    </div>
  );
}

export function NowPlayingModal({ roomName, open, onOpenChange }: NowPlayingModalProps) {
  const { devices } = useDevices();
  const { zoneStatuses } = useZoneStatuses();
  const device = devices.find((d) => d.roomName === roomName);

  const playPauseMutation = usePlayPause();
  const nextMutation = useNext();
  const previousMutation = usePrevious();
  const volumeMutation = useVolume();
  const groupVolumeMutation = useGroupVolume();
  const toggleMuteMutation = useToggleMute();

  // Find the zone for this device and get all grouped devices
  const zone = useMemo(() => {
    if (!device) return null;
    return zoneStatuses.find((z) => z.memberIds.includes(device.id));
  }, [device, zoneStatuses]);

  const groupedDevices = useMemo(() => {
    if (!zone) return [];
    // Get all devices in this zone, sorted with coordinator first
    return devices
      .filter((d) => zone.memberIds.includes(d.id))
      .sort((a, b) => {
        if (a.isCoordinator) return -1;
        if (b.isCoordinator) return 1;
        return a.roomName.localeCompare(b.roomName);
      });
  }, [zone, devices]);

  const isGrouped = groupedDevices.length > 1;
  const coordinatorDevice = groupedDevices.find((d) => d.isCoordinator) || device;

  // Local volume state for immediate UI feedback (used for single device mode)
  const [localVolume, setLocalVolume] = useState(device?.volume ?? 50);
  const [isDragging, setIsDragging] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Group volume state for immediate UI feedback
  const [localGroupVolume, setLocalGroupVolume] = useState(zone?.volume ?? 50);
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  const groupDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if album art failed to load
  const [albumArtError, setAlbumArtError] = useState(false);

  // Local position state for smooth progress updates between API refreshes
  const [localPosition, setLocalPosition] = useState(0);
  const lastSyncedTrackRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);

  // Reset album art error when the URI changes
  useEffect(() => {
    setAlbumArtError(false);
  }, [device?.nowPlaying?.albumArtUri, device?.nowPlaying?.absoluteAlbumArtUri]);

  // Fetch actual position from API when modal opens or track changes
  useEffect(() => {
    if (!open) {
      // Reset tracking when modal closes so next open will sync
      wasOpenRef.current = false;
      lastSyncedTrackRef.current = null;
      return;
    }

    const currentTrack = device?.nowPlaying?.title ?? '';
    const justOpened = !wasOpenRef.current;
    const trackChanged = currentTrack !== lastSyncedTrackRef.current;

    // Fetch position when modal just opened or track changes
    if (justOpened || trackChanged) {
      lastSyncedTrackRef.current = currentTrack;
      wasOpenRef.current = true;

      // Fetch the actual position from the state endpoint
      const targetRoom = coordinatorDevice?.roomName || roomName;
      getPlaybackPosition(targetRoom).then((position) => {
        setLocalPosition(position);
      });
    }
  }, [open, device?.nowPlaying?.title, coordinatorDevice?.roomName, roomName]);

  // Interpolate position every second when playing
  useEffect(() => {
    if (!open || device?.playbackState !== 'PLAYING' || !device?.nowPlaying?.duration) {
      return;
    }

    const intervalId = setInterval(() => {
      setLocalPosition((prev) => {
        const duration = device?.nowPlaying?.duration ?? 0;
        // Don't exceed duration
        if (prev >= duration) return prev;
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [open, device?.playbackState, device?.nowPlaying?.duration]);

  // Sync local volume with device volume when not dragging
  useEffect(() => {
    if (!isDragging && device) {
      setLocalVolume(device.volume);
    }
  }, [device?.volume, isDragging, device]);

  // Sync group volume when not dragging
  useEffect(() => {
    if (!isGroupDragging && zone) {
      setLocalGroupVolume(zone.volume);
    }
  }, [zone?.volume, isGroupDragging, zone]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (groupDebounceTimerRef.current) {
        clearTimeout(groupDebounceTimerRef.current);
      }
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    if (coordinatorDevice) {
      playPauseMutation.mutate(coordinatorDevice.roomName);
    }
  }, [coordinatorDevice, playPauseMutation]);

  const handleNext = useCallback(() => {
    if (coordinatorDevice) {
      nextMutation.mutate(coordinatorDevice.roomName);
    }
  }, [coordinatorDevice, nextMutation]);

  const handlePrevious = useCallback(() => {
    if (coordinatorDevice) {
      previousMutation.mutate(coordinatorDevice.roomName);
    }
  }, [coordinatorDevice, previousMutation]);

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0];
      setLocalVolume(newVolume);
      setIsDragging(true);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (device) {
          volumeMutation.mutate({ roomName: device.roomName, volume: newVolume });
        }
        setIsDragging(false);
      }, VOLUME_DEBOUNCE_MS);
    },
    [device, volumeMutation]
  );

  const handleDeviceVolumeChange = useCallback(
    (deviceRoomName: string, volume: number) => {
      volumeMutation.mutate({ roomName: deviceRoomName, volume });
    },
    [volumeMutation]
  );

  const handleDeviceToggleMute = useCallback(
    (deviceRoomName: string) => {
      toggleMuteMutation.mutate(deviceRoomName);
    },
    [toggleMuteMutation]
  );

  const handleToggleMute = useCallback(() => {
    if (device) {
      toggleMuteMutation.mutate(device.roomName);
    }
  }, [device, toggleMuteMutation]);

  const handleGroupVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0];
      setLocalGroupVolume(newVolume);
      setIsGroupDragging(true);

      if (groupDebounceTimerRef.current) {
        clearTimeout(groupDebounceTimerRef.current);
      }

      groupDebounceTimerRef.current = setTimeout(() => {
        if (coordinatorDevice) {
          groupVolumeMutation.mutate({ roomName: coordinatorDevice.roomName, volume: newVolume });
        }
        setIsGroupDragging(false);
      }, VOLUME_DEBOUNCE_MS);
    },
    [coordinatorDevice, groupVolumeMutation]
  );

  if (!device) {
    return null;
  }

  const isPlaying = device.playbackState === 'PLAYING';
  const nowPlaying = device.nowPlaying;
  const hasTrack = !!nowPlaying?.title;
  const isRadio = nowPlaying?.type === 'radio' || !!nowPlaying?.stationName;
  const hasDuration = nowPlaying?.duration && nowPlaying.duration > 0;

  // Calculate progress percentage using local position for smooth updates
  const progressPercent = hasDuration
    ? (localPosition / nowPlaying.duration) * 100
    : 0;

  // Calculate remaining time
  const remainingTime = hasDuration ? Math.max(0, nowPlaying.duration - localPosition) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-md', isGrouped && 'sm:max-w-2xl')}>
        <DialogHeader>
          <DialogTitle>
            Now Playing on {isGrouped ? `${groupedDevices.length} speakers` : roomName}
          </DialogTitle>
        </DialogHeader>

        <div className={cn('flex gap-6', isGrouped ? 'flex-row' : 'flex-col')}>
          {/* Main Content - Now Playing */}
          <div className={cn('space-y-6', isGrouped && 'flex-1')}>
            {/* Album Art or Placeholder */}
            <div className="flex justify-center">
              <div className={cn(
                'rounded-lg bg-muted flex items-center justify-center overflow-hidden',
                isGrouped ? 'w-40 h-40' : 'w-48 h-48'
              )}>
                {(nowPlaying?.absoluteAlbumArtUri || nowPlaying?.albumArtUri) && !albumArtError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getProxiedAlbumArtUrl(nowPlaying.absoluteAlbumArtUri || nowPlaying.albumArtUri, coordinatorDevice?.roomName || roomName)}
                    alt={nowPlaying.album || nowPlaying.title || 'Album art'}
                    className="w-full h-full object-cover"
                    onError={() => setAlbumArtError(true)}
                  />
                ) : isRadio ? (
                  <Radio className={cn(isGrouped ? 'w-16 h-16' : 'w-20 h-20', 'text-muted-foreground')} />
                ) : (
                  <Disc3 className={cn(isGrouped ? 'w-16 h-16' : 'w-20 h-20', 'text-muted-foreground')} />
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="text-center space-y-1">
              {hasTrack ? (
                <>
                  <p className="text-lg font-semibold text-foreground truncate">
                    {isRadio && nowPlaying?.stationName ? nowPlaying.stationName : nowPlaying?.title}
                  </p>
                  {nowPlaying?.artist && (
                    <p className="text-sm text-muted-foreground truncate">
                      {nowPlaying.artist}
                    </p>
                  )}
                  {nowPlaying?.album && !isRadio && (
                    <p className="text-sm text-muted-foreground truncate">
                      {nowPlaying.album}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Not playing</p>
              )}
            </div>

            {/* Progress Bar (only show for tracks with duration) */}
            {hasDuration && (
              <div className="space-y-2">
                <Slider
                  value={[progressPercent]}
                  max={100}
                  step={0.1}
                  disabled
                  className="cursor-default"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(localPosition)}</span>
                  <span>-{formatTime(remainingTime)}</span>
                </div>
              </div>
            )}

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={handlePrevious}
                disabled={previousMutation.isPending}
              >
                {previousMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <SkipBack className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-14 w-14',
                  isPlaying
                    ? 'text-primary hover:text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={handlePlayPause}
                disabled={playPauseMutation.isPending}
              >
                {playPauseMutation.isPending ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={handleNext}
                disabled={nextMutation.isPending}
              >
                {nextMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <SkipForward className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Volume Control (only show for single device) */}
            {!isGrouped && (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={handleToggleMute}
                >
                  {device.muted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>

                <Slider
                  value={[device.muted ? 0 : localVolume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />

                <span className="text-sm text-muted-foreground w-10 text-right flex-shrink-0">
                  {localVolume}%
                </span>
              </div>
            )}
          </div>

          {/* Grouped Devices Pane */}
          {isGrouped && (
            <div className="w-64 flex-shrink-0 border-l border-border pl-6">
              {/* Group Volume Control */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground">All Speakers</span>
                  <span className="text-xs text-muted-foreground">{localGroupVolume}%</span>
                </div>
                <Slider
                  value={[localGroupVolume]}
                  max={100}
                  step={1}
                  onValueChange={handleGroupVolumeChange}
                  className="w-full"
                />
              </div>

              {/* Individual Speaker Controls */}
              <div className="border-t border-border pt-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-3">Individual</h4>
                <div className="space-y-3">
                  {groupedDevices.map((groupDevice) => (
                    <DeviceVolumeControl
                      key={groupDevice.id}
                      device={groupDevice}
                      isCoordinator={groupDevice.isCoordinator}
                      onVolumeChange={handleDeviceVolumeChange}
                      onToggleMute={handleDeviceToggleMute}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

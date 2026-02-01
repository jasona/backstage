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
  useToggleMute,
} from '@/hooks/use-sonos';
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
 * Individual device volume control for grouped devices
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
    <div className="flex items-center gap-2 py-2">
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        {isCoordinator ? (
          <Crown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        ) : (
          <Speaker className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        )}
        <span className="text-sm text-foreground truncate">{device.roomName}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
        onClick={handleToggleMute}
      >
        {device.muted ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </Button>
      <Slider
        value={[device.muted ? 0 : localVolume]}
        max={100}
        step={1}
        onValueChange={handleVolumeChange}
        className="flex-1"
      />
      <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">
        {localVolume}%
      </span>
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

  // Track if album art failed to load
  const [albumArtError, setAlbumArtError] = useState(false);

  // Reset album art error when the URI changes
  useEffect(() => {
    setAlbumArtError(false);
  }, [device?.nowPlaying?.albumArtUri]);

  // Sync local volume with device volume when not dragging
  useEffect(() => {
    if (!isDragging && device) {
      setLocalVolume(device.volume);
    }
  }, [device?.volume, isDragging, device]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
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

  if (!device) {
    return null;
  }

  const isPlaying = device.playbackState === 'PLAYING';
  const nowPlaying = device.nowPlaying;
  const hasTrack = !!nowPlaying?.title;
  const isRadio = nowPlaying?.type === 'radio' || !!nowPlaying?.stationName;
  const hasDuration = nowPlaying?.duration && nowPlaying.duration > 0;

  // Calculate progress percentage
  const progressPercent = hasDuration && nowPlaying?.position
    ? (nowPlaying.position / nowPlaying.duration) * 100
    : 0;

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
                {nowPlaying?.albumArtUri && !albumArtError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={nowPlaying.albumArtUri}
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
                  <span>{formatTime(nowPlaying?.position ?? 0)}</span>
                  <span>{formatTime(nowPlaying?.duration ?? 0)}</span>
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
              <h4 className="text-sm font-medium text-foreground mb-3">Speakers</h4>
              <div className="space-y-1">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

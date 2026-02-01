'use client';

/**
 * Now Playing modal that displays album art, track info, and music controls.
 * Opens when clicking on the song name in Dashboard or Groups screens.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';

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

export function NowPlayingModal({ roomName, open, onOpenChange }: NowPlayingModalProps) {
  const { devices } = useDevices();
  const device = devices.find((d) => d.roomName === roomName);

  const playPauseMutation = usePlayPause();
  const nextMutation = useNext();
  const previousMutation = usePrevious();
  const volumeMutation = useVolume();
  const toggleMuteMutation = useToggleMute();

  // Local volume state for immediate UI feedback
  const [localVolume, setLocalVolume] = useState(device?.volume ?? 50);
  const [isDragging, setIsDragging] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (device) {
      playPauseMutation.mutate(device.roomName);
    }
  }, [device, playPauseMutation]);

  const handleNext = useCallback(() => {
    if (device) {
      nextMutation.mutate(device.roomName);
    }
  }, [device, nextMutation]);

  const handlePrevious = useCallback(() => {
    if (device) {
      previousMutation.mutate(device.roomName);
    }
  }, [device, previousMutation]);

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Now Playing on {roomName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Album Art or Placeholder */}
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {nowPlaying?.albumArtUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nowPlaying.albumArtUri}
                  alt={nowPlaying.album || nowPlaying.title || 'Album art'}
                  className="w-full h-full object-cover"
                />
              ) : isRadio ? (
                <Radio className="w-20 h-20 text-muted-foreground" />
              ) : (
                <Disc3 className="w-20 h-20 text-muted-foreground" />
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

          {/* Volume Control */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

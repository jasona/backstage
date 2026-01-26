'use client';

/**
 * Individual device card component.
 * Displays device status, now playing, and controls.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Users,
  Loader2,
  Crown,
  Music,
} from 'lucide-react';
import type { DeviceStatus } from '@/types/sonos';
import type { ZoneStatus } from '@/types/sonos';

// Debounce delay for volume changes (ms)
const VOLUME_DEBOUNCE_MS = 100;

interface DeviceCardProps {
  device: DeviceStatus;
  /** Zone info for this device's group */
  zone?: ZoneStatus;
  isSelected?: boolean;
  isPlayPauseLoading?: boolean;
  isNextLoading?: boolean;
  isPreviousLoading?: boolean;
  onSelect?: (deviceId: string) => void;
  onPlayPause?: (roomName: string) => void;
  onNext?: (roomName: string) => void;
  onPrevious?: (roomName: string) => void;
  onVolumeChange?: (roomName: string, volume: number) => void;
  onToggleMute?: (roomName: string) => void;
  onGroupManage?: (device: DeviceStatus) => void;
  /** Called when play is clicked on a stopped device with no queue */
  onPickMusic?: (roomName: string) => void;
}

export function DeviceCard({
  device,
  zone,
  isSelected = false,
  isPlayPauseLoading = false,
  isNextLoading = false,
  isPreviousLoading = false,
  onSelect,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onToggleMute,
  onGroupManage,
  onPickMusic,
}: DeviceCardProps) {
  const isPlaying = device.playbackState === 'PLAYING';
  const hasNowPlaying = device.nowPlaying?.title;
  const isInGroup = zone && zone.memberIds.length > 1;

  // Local volume state for immediate UI feedback
  const [localVolume, setLocalVolume] = useState(device.volume);
  const [isDragging, setIsDragging] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local volume with device volume when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalVolume(device.volume);
    }
  }, [device.volume, isDragging]);

  const handleClick = useCallback(() => {
    onSelect?.(device.id);
  }, [device.id, onSelect]);

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // If device is stopped with no queue, open music picker
      if (device.playbackState === 'STOPPED' && !hasNowPlaying && onPickMusic) {
        onPickMusic(device.roomName);
      } else {
        onPlayPause?.(device.roomName);
      }
    },
    [device.roomName, device.playbackState, hasNowPlaying, onPlayPause, onPickMusic]
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onNext?.(device.roomName);
    },
    [device.roomName, onNext]
  );

  const handlePrevious = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPrevious?.(device.roomName);
    },
    [device.roomName, onPrevious]
  );

  // Debounced volume change handler
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0];
      setLocalVolume(newVolume);
      setIsDragging(true);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounced timer
      debounceTimerRef.current = setTimeout(() => {
        onVolumeChange?.(device.roomName, newVolume);
        setIsDragging(false);
      }, VOLUME_DEBOUNCE_MS);
    },
    [device.roomName, onVolumeChange]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleToggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleMute?.(device.roomName);
    },
    [device.roomName, onToggleMute]
  );

  const handlePickMusic = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPickMusic?.(device.roomName);
    },
    [device.roomName, onPickMusic]
  );

  return (
    <Card
      className={cn(
        'bg-surface border-border-subtle cursor-pointer transition-all duration-300 hover:bg-hover hover:-translate-y-0.5',
        isPlaying && 'border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Room name and status */}
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {device.roomName}
              </h3>
              {isInGroup && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs px-1.5 py-0 cursor-pointer hover:bg-accent transition-colors',
                          device.isCoordinator
                            ? 'border-primary/50 text-primary'
                            : 'border-border-subtle text-muted-foreground'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onGroupManage?.(device);
                        }}
                      >
                        {device.isCoordinator ? (
                          <Crown className="w-3 h-3 mr-1" />
                        ) : (
                          <Users className="w-3 h-3 mr-1" />
                        )}
                        {device.isCoordinator ? 'Leading' : zone?.coordinatorRoom}
                        <span className="ml-1 text-muted-foreground">
                          +{zone!.memberIds.length - 1}
                        </span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {device.isCoordinator ? (
                        <p>Group leader - controls playback for {zone!.memberIds.length} speakers</p>
                      ) : (
                        <p>Grouped with {zone?.coordinatorRoom} - follows its playback</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {device.modelName}
            </p>
          </div>

          {/* Group button for ungrouped devices */}
          {!isInGroup && onGroupManage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGroupManage(device);
                    }}
                  >
                    <Users className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Group</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Group with other speakers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Status indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0 mt-1.5 transition-colors duration-300',
                    isPlaying && 'bg-success animate-pulse',
                    device.playbackState === 'PAUSED_PLAYBACK' && 'bg-warning',
                    device.playbackState === 'STOPPED' && 'bg-muted-foreground'
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                {isPlaying && <p>Playing</p>}
                {device.playbackState === 'PAUSED_PLAYBACK' && <p>Paused</p>}
                {device.playbackState === 'STOPPED' && <p>Stopped</p>}
                {device.playbackState === 'TRANSITIONING' && <p>Loading...</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Now Playing */}
        {hasNowPlaying && (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground truncate">
              {device.nowPlaying?.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {device.nowPlaying?.artist}
              {device.nowPlaying?.album && ` • ${device.nowPlaying.album}`}
            </p>
          </div>
        )}

        {!hasNowPlaying && (
          <p className="text-sm text-muted-foreground">Not playing</p>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handlePickMusic}
                >
                  <Music className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change music</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handlePrevious}
            disabled={isPreviousLoading}
          >
            {isPreviousLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SkipBack className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-10 w-10',
              isPlaying
                ? 'text-primary hover:text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={handlePlayPause}
            disabled={isPlayPauseLoading}
          >
            {isPlayPauseLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleNext}
            disabled={isNextLoading}
          >
            {isNextLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SkipForward className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
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
            onClick={(e) => e.stopPropagation()}
          />

          <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">
            {localVolume}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

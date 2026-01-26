'use client';

/**
 * Draggable device card for the groups page.
 * Uses @dnd-kit for drag and drop functionality.
 * Can be both dragged and dropped onto (to create new groups).
 */

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Crown,
  GripVertical,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  Loader2,
} from 'lucide-react';
import type { DeviceStatus } from '@/types/sonos';
import { useState, useEffect, useRef, useCallback } from 'react';

const VOLUME_DEBOUNCE_MS = 100;

interface DraggableDeviceProps {
  device: DeviceStatus;
  /** Whether this device can be dropped onto (usually only ungrouped devices) */
  isDroppable?: boolean;
  /** Whether to show playback controls (for ungrouped devices) */
  showPlaybackControls?: boolean;
  onVolumeChange?: (roomName: string, volume: number) => void;
  onToggleMute?: (roomName: string) => void;
  onPlayPause?: (roomName: string) => void;
  onNext?: (roomName: string) => void;
  onPrevious?: (roomName: string) => void;
  onPickMusic?: (roomName: string) => void;
  isPlayPauseLoading?: boolean;
  isNextLoading?: boolean;
  isPreviousLoading?: boolean;
}

export function DraggableDevice({
  device,
  isDroppable = false,
  showPlaybackControls = false,
  onVolumeChange,
  onToggleMute,
  onPlayPause,
  onNext,
  onPrevious,
  onPickMusic,
  isPlayPauseLoading = false,
  isNextLoading = false,
  isPreviousLoading = false,
}: DraggableDeviceProps) {
  const isPlaying = device.playbackState === 'PLAYING';
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: device.id,
    data: { device },
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `device-drop-${device.id}`,
    data: { device, type: 'device' },
    disabled: !isDroppable,
  });

  // Combine refs
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );

  // Local volume state for immediate UI feedback
  const [localVolume, setLocalVolume] = useState(device.volume);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local volume with device volume when not dragging
  useEffect(() => {
    if (!isDraggingVolume) {
      setLocalVolume(device.volume);
    }
  }, [device.volume, isDraggingVolume]);

  // Cleanup debounce timer on unmount
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
      setIsDraggingVolume(true);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onVolumeChange?.(device.roomName, newVolume);
        setIsDraggingVolume(false);
      }, VOLUME_DEBOUNCE_MS);
    },
    [device.roomName, onVolumeChange]
  );

  const handleToggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleMute?.(device.roomName);
    },
    [device.roomName, onToggleMute]
  );

  const handlePlayPause = useCallback(() => {
    onPlayPause?.(device.roomName);
  }, [device.roomName, onPlayPause]);

  const handleNext = useCallback(() => {
    onNext?.(device.roomName);
  }, [device.roomName, onNext]);

  const handlePrevious = useCallback(() => {
    onPrevious?.(device.roomName);
  }, [device.roomName, onPrevious]);

  const handlePickMusic = useCallback(() => {
    onPickMusic?.(device.roomName);
  }, [device.roomName, onPickMusic]);

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <Card
        className={cn(
          'bg-surface border-border-subtle transition-all',
          isDragging && 'shadow-lg ring-2 ring-primary/50',
          isOver && isDroppable && 'ring-2 ring-primary border-primary/50 bg-primary/5'
        )}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header with drag handle */}
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {device.roomName}
                </span>
                {device.isCoordinator && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 border-primary/50 text-primary"
                        >
                          <Crown className="w-3 h-3" />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Group coordinator - controls playback</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>

          {/* Now Playing (for ungrouped devices with playback controls) - fixed height */}
          {showPlaybackControls && (
            <div className="text-xs text-muted-foreground truncate h-4">
              {device.nowPlaying?.title ? (
                <span>
                  {device.nowPlaying.title}
                  {device.nowPlaying.artist && ` - ${device.nowPlaying.artist}`}
                </span>
              ) : (
                <span>Not playing</span>
              )}
            </div>
          )}

          {/* Playback Controls (for ungrouped devices) */}
          {showPlaybackControls && (
            <div className="flex items-center justify-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={handlePickMusic}
                    >
                      <Music className="w-3.5 h-3.5" />
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
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handlePrevious}
                disabled={isPreviousLoading}
              >
                {isPreviousLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <SkipBack className="w-3.5 h-3.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  isPlaying
                    ? 'text-primary hover:text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={handlePlayPause}
                disabled={isPlayPauseLoading}
              >
                {isPlayPauseLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleNext}
                disabled={isNextLoading}
              >
                {isNextLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <SkipForward className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-2">
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

            <span className="text-xs text-muted-foreground w-7 text-right flex-shrink-0">
              {localVolume}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Drag overlay version - shown while dragging
 */
export function DraggableDeviceOverlay({ device }: { device: DeviceStatus }) {
  return (
    <Card className="bg-surface border-border-subtle shadow-xl ring-2 ring-primary w-[260px]">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate">
            {device.roomName}
          </span>
          {device.isCoordinator && (
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 border-primary/50 text-primary"
            >
              <Crown className="w-3 h-3" />
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

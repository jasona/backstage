'use client';

/**
 * Group-level playback and volume controls.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Loader2,
  Music,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ZoneStatus } from '@/types/sonos';

const VOLUME_DEBOUNCE_MS = 100;

interface GroupControlsProps {
  zone: ZoneStatus;
  onPlayPause?: (roomName: string) => void;
  onNext?: (roomName: string) => void;
  onPrevious?: (roomName: string) => void;
  onGroupVolumeChange?: (roomName: string, volume: number) => void;
  onToggleMute?: (roomName: string) => void;
  onPickMusic?: (roomName: string) => void;
  isPlayPauseLoading?: boolean;
  isNextLoading?: boolean;
  isPreviousLoading?: boolean;
}

export function GroupControls({
  zone,
  onPlayPause,
  onNext,
  onPrevious,
  onGroupVolumeChange,
  onToggleMute,
  onPickMusic,
  isPlayPauseLoading = false,
  isNextLoading = false,
  isPreviousLoading = false,
}: GroupControlsProps) {
  const isPlaying = zone.playbackState === 'PLAYING';
  const coordinatorRoom = zone.coordinatorRoom;

  const handlePickMusic = useCallback(() => {
    onPickMusic?.(coordinatorRoom);
  }, [coordinatorRoom, onPickMusic]);

  // Local volume state for immediate UI feedback
  const [localVolume, setLocalVolume] = useState(zone.volume);
  const [isDragging, setIsDragging] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local volume with zone volume when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalVolume(zone.volume);
    }
  }, [zone.volume, isDragging]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    onPlayPause?.(coordinatorRoom);
  }, [coordinatorRoom, onPlayPause]);

  const handleNext = useCallback(() => {
    onNext?.(coordinatorRoom);
  }, [coordinatorRoom, onNext]);

  const handlePrevious = useCallback(() => {
    onPrevious?.(coordinatorRoom);
  }, [coordinatorRoom, onPrevious]);

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0];
      setLocalVolume(newVolume);
      setIsDragging(true);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onGroupVolumeChange?.(coordinatorRoom, newVolume);
        setIsDragging(false);
      }, VOLUME_DEBOUNCE_MS);
    },
    [coordinatorRoom, onGroupVolumeChange]
  );

  const handleToggleMute = useCallback(() => {
    onToggleMute?.(coordinatorRoom);
  }, [coordinatorRoom, onToggleMute]);

  return (
    <div className="space-y-3">
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
          {zone.muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>

        <Slider
          value={[zone.muted ? 0 : localVolume]}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="flex-1"
        />

        <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">
          {localVolume}%
        </span>
      </div>
    </div>
  );
}

'use client';

/**
 * Individual device card component.
 * Displays device status, now playing, and controls.
 */

import { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Users,
} from 'lucide-react';
import type { DeviceStatus } from '@/types/sonos';

interface DeviceCardProps {
  device: DeviceStatus;
  isSelected?: boolean;
  onSelect?: (deviceId: string) => void;
  onPlayPause?: (roomName: string) => void;
  onNext?: (roomName: string) => void;
  onPrevious?: (roomName: string) => void;
  onVolumeChange?: (roomName: string, volume: number) => void;
  onToggleMute?: (roomName: string) => void;
}

export function DeviceCard({
  device,
  isSelected = false,
  onSelect,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onToggleMute,
}: DeviceCardProps) {
  const isPlaying = device.playbackState === 'PLAYING';
  const hasNowPlaying = device.nowPlaying?.title;

  const handleClick = useCallback(() => {
    onSelect?.(device.id);
  }, [device.id, onSelect]);

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPlayPause?.(device.roomName);
    },
    [device.roomName, onPlayPause]
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

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      onVolumeChange?.(device.roomName, value[0]);
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

  return (
    <Card
      className={cn(
        'bg-surface border-border-subtle cursor-pointer transition-all hover:bg-hover hover:-translate-y-0.5',
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
              {device.isCoordinator && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  <Users className="w-3 h-3 mr-1" />
                  Group
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {device.modelName}
            </p>
          </div>

          {/* Status indicator */}
          <div
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0 mt-1.5',
              isPlaying && 'bg-success',
              device.playbackState === 'PAUSED_PLAYBACK' && 'bg-warning',
              device.playbackState === 'STOPPED' && 'bg-muted-foreground'
            )}
          />
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handlePrevious}
          >
            <SkipBack className="w-4 h-4" />
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
          >
            {isPlaying ? (
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
          >
            <SkipForward className="w-4 h-4" />
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
            value={[device.muted ? 0 : device.volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
            onClick={(e) => e.stopPropagation()}
          />

          <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">
            {device.volume}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

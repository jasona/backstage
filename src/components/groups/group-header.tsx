'use client';

/**
 * Header for a group zone showing coordinator name, member count, and now playing.
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ZoneStatus } from '@/types/sonos';

interface GroupHeaderProps {
  zone: ZoneStatus;
  className?: string;
}

export function GroupHeader({ zone, className }: GroupHeaderProps) {
  const isPlaying = zone.playbackState === 'PLAYING';
  const hasNowPlaying = zone.nowPlaying?.title;
  const memberCount = zone.memberIds.length;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Title row */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground truncate">
          {zone.coordinatorRoom}
        </h3>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs flex-shrink-0',
                  memberCount > 1 && 'border-primary/50 text-primary'
                )}
              >
                <Users className="w-3 h-3 mr-1" />
                {memberCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {memberCount === 1
                  ? '1 speaker'
                  : `${memberCount} speakers in this group`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Now playing */}
      {hasNowPlaying ? (
        <div className="flex items-start gap-2">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5',
              isPlaying && 'bg-success animate-pulse',
              zone.playbackState === 'PAUSED_PLAYBACK' && 'bg-warning',
              zone.playbackState === 'STOPPED' && 'bg-muted-foreground'
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {zone.nowPlaying?.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {zone.nowPlaying?.artist}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Music className="w-3.5 h-3.5" />
          <span className="text-sm">Not playing</span>
        </div>
      )}
    </div>
  );
}

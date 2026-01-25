'use client';

/**
 * Network matrix visualization component.
 * Shows a visual grid of device connections and status.
 * Note: Real signal strength data would require direct device access.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Speaker } from 'lucide-react';
import type { DeviceStatus } from '@/types/sonos';

interface NetworkMatrixProps {
  devices: DeviceStatus[];
  isLoading: boolean;
}

// Signal strength colors (simulated based on playback state for now)
const getSignalColor = (isActive: boolean, isGrouped: boolean) => {
  if (isActive) return 'bg-success';
  if (isGrouped) return 'bg-primary';
  return 'bg-muted-foreground/50';
};

const getSignalLabel = (isActive: boolean, isGrouped: boolean) => {
  if (isActive) return 'Active';
  if (isGrouped) return 'Grouped';
  return 'Idle';
};

export function NetworkMatrix({ devices, isLoading }: NetworkMatrixProps) {
  // Group devices by their group ID
  const deviceGroups = useMemo(() => {
    const groups: Map<string, DeviceStatus[]> = new Map();

    devices.forEach((device) => {
      const groupId = device.groupId || device.id;
      if (!groups.has(groupId)) {
        groups.set(groupId, []);
      }
      groups.get(groupId)!.push(device);
    });

    return groups;
  }, [devices]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const playing = devices.filter((d) => d.playbackState === 'PLAYING').length;
    const grouped = devices.filter((d) => !d.isCoordinator).length;
    const groups = new Set(devices.map((d) => d.groupId || d.id)).size;

    return { playing, grouped, groups, total: devices.length };
  }, [devices]);

  if (isLoading) {
    return (
      <Card className="bg-surface border-border-subtle">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-border-subtle">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Network Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} devices
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.groups} groups
            </Badge>
            <Badge variant="default" className="text-xs">
              {stats.playing} playing
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success" />
            <span>Playing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>Grouped</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted-foreground/50" />
            <span>Idle</span>
          </div>
        </div>

        {/* Device Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {devices.map((device) => {
              const isPlaying = device.playbackState === 'PLAYING';
              const isGrouped = !device.isCoordinator;

              return (
                <Tooltip key={device.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'aspect-square rounded-lg flex flex-col items-center justify-center gap-1 p-2 transition-all cursor-pointer hover:scale-105',
                        isPlaying
                          ? 'bg-success/20 border border-success/30'
                          : isGrouped
                          ? 'bg-primary/20 border border-primary/30'
                          : 'bg-muted/50 border border-border-subtle'
                      )}
                    >
                      <Speaker
                        className={cn(
                          'w-4 h-4',
                          isPlaying
                            ? 'text-success'
                            : isGrouped
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      />
                      <span className="text-[10px] text-center truncate w-full px-1 text-muted-foreground">
                        {device.roomName.slice(0, 8)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{device.roomName}</p>
                      <p className="text-xs text-muted-foreground">
                        {device.modelName}
                      </p>
                      <p className="text-xs">
                        Status:{' '}
                        {isPlaying
                          ? 'Playing'
                          : device.playbackState === 'PAUSED_PLAYBACK'
                          ? 'Paused'
                          : 'Stopped'}
                      </p>
                      <p className="text-xs">Volume: {device.volume}%</p>
                      {device.nowPlaying?.title && (
                        <p className="text-xs text-muted-foreground">
                          {device.nowPlaying.title}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Groups Section */}
        {deviceGroups.size > 1 && (
          <div className="mt-6 pt-4 border-t border-border-subtle">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Active Groups
            </h4>
            <div className="space-y-2">
              {Array.from(deviceGroups.entries())
                .filter(([, members]) => members.length > 1)
                .map(([groupId, members]) => {
                  const coordinator = members.find((m) => m.isCoordinator);
                  return (
                    <div
                      key={groupId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Badge variant="outline" className="text-xs">
                        {coordinator?.roomName || 'Unknown'}
                      </Badge>
                      <span className="text-muted-foreground">
                        + {members.length - 1} member{members.length > 2 ? 's' : ''}
                      </span>
                      <div className="flex gap-1">
                        {members
                          .filter((m) => !m.isCoordinator)
                          .slice(0, 3)
                          .map((m) => (
                            <span
                              key={m.id}
                              className="text-xs text-muted-foreground"
                            >
                              {m.roomName}
                            </span>
                          ))}
                        {members.length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            ...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

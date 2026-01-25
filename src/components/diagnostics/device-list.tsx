'use client';

/**
 * Device list for diagnostics page.
 * Shows detailed device information in a table/card format.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Speaker,
  Wifi,
  Volume2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import type { DeviceStatus } from '@/types/sonos';

interface DeviceListProps {
  devices: DeviceStatus[];
  isLoading: boolean;
}

export function DeviceList({ devices, isLoading }: DeviceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-surface border-border-subtle">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 bg-muted" />
                  <Skeleton className="h-3 w-48 bg-muted" />
                </div>
                <Skeleton className="w-20 h-6 bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <Card className="bg-surface border-border-subtle">
        <CardContent className="p-8 text-center">
          <Speaker className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No devices found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <Link
          key={device.id}
          href={`/dashboard/diagnostics/${device.id}`}
          className="block"
        >
          <Card className="bg-surface border-border-subtle hover:bg-hover transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    device.playbackState === 'PLAYING'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Speaker className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">
                      {device.roomName}
                    </h3>
                    {device.isCoordinator && (
                      <Badge variant="outline" className="text-xs">
                        Coordinator
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{device.modelName}</span>
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      {device.volume}%
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      device.playbackState === 'PLAYING'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {device.playbackState === 'PLAYING'
                      ? 'Playing'
                      : device.playbackState === 'PAUSED_PLAYBACK'
                      ? 'Paused'
                      : 'Stopped'}
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

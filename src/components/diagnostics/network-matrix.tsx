'use client';

/**
 * Network matrix visualization component.
 * Shows a visual grid of device connections and network status.
 * Uses real network diagnostics data when available.
 */

import { useMemo } from 'react';
import Link from 'next/link';
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
import {
  Wifi,
  WifiOff,
  Speaker,
  Cable,
  Radio,
  SignalHigh,
  SignalMedium,
  SignalLow,
} from 'lucide-react';
import type { DeviceStatus } from '@/types/sonos';
import type { DeviceNetworkDiagnostics, SignalQuality, NetworkConnectionType } from '@/types/sonos';

interface NetworkMatrixProps {
  devices: DeviceStatus[];
  diagnostics?: DeviceNetworkDiagnostics[];
  isLoading: boolean;
}

// Get connection type icon
function ConnectionIcon({ type }: { type: NetworkConnectionType }) {
  switch (type) {
    case 'ethernet':
      return <Cable className="w-3 h-3" />;
    case 'sonosnet':
      return <Radio className="w-3 h-3" />;
    case 'wifi':
      return <Wifi className="w-3 h-3" />;
    default:
      return <Wifi className="w-3 h-3" />;
  }
}

// Get signal quality styling
function getSignalStyles(quality: SignalQuality, isPlaying: boolean) {
  if (quality === 'offline') {
    return {
      bgClass: 'bg-muted/50 border border-border-subtle',
      iconClass: 'text-muted-foreground',
      icon: <WifiOff className="w-4 h-4" />,
    };
  }

  if (quality === 'poor') {
    return {
      bgClass: 'bg-destructive/20 border border-destructive/30',
      iconClass: 'text-destructive',
      icon: <SignalLow className="w-4 h-4" />,
    };
  }

  if (quality === 'fair') {
    return {
      bgClass: 'bg-warning/20 border border-warning/30',
      iconClass: 'text-warning',
      icon: <SignalMedium className="w-4 h-4" />,
    };
  }

  // excellent or good
  if (isPlaying) {
    return {
      bgClass: 'bg-success/20 border border-success/30',
      iconClass: 'text-success',
      icon: <SignalHigh className="w-4 h-4" />,
    };
  }

  return {
    bgClass: 'bg-primary/10 border border-primary/20',
    iconClass: 'text-primary',
    icon: <SignalHigh className="w-4 h-4" />,
  };
}

// Fallback styling when no diagnostics available
function getFallbackStyles(device: DeviceStatus) {
  const isPlaying = device.playbackState === 'PLAYING';
  const isGrouped = !device.isCoordinator;

  if (isPlaying) {
    return {
      bgClass: 'bg-success/20 border border-success/30',
      iconClass: 'text-success',
    };
  }
  if (isGrouped) {
    return {
      bgClass: 'bg-primary/20 border border-primary/30',
      iconClass: 'text-primary',
    };
  }
  return {
    bgClass: 'bg-muted/50 border border-border-subtle',
    iconClass: 'text-muted-foreground',
  };
}

export function NetworkMatrix({ devices, diagnostics, isLoading }: NetworkMatrixProps) {
  // Create a map of device diagnostics by ID for quick lookup
  const diagnosticsMap = useMemo(() => {
    const map = new Map<string, DeviceNetworkDiagnostics>();
    if (diagnostics) {
      for (const d of diagnostics) {
        map.set(d.deviceId, d);
      }
    }
    return map;
  }, [diagnostics]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const playing = devices.filter((d) => d.playbackState === 'PLAYING').length;
    const online = diagnostics
      ? diagnostics.filter((d) => d.isReachable).length
      : devices.length;
    const offline = diagnostics
      ? diagnostics.filter((d) => !d.isReachable).length
      : 0;
    const wired = diagnostics?.filter((d) => d.isWired).length ?? 0;

    return { playing, online, offline, wired, total: devices.length };
  }, [devices, diagnostics]);

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

  const hasDiagnostics = diagnostics && diagnostics.length > 0;

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
              {stats.online} online
            </Badge>
            {stats.offline > 0 && (
              <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                {stats.offline} offline
              </Badge>
            )}
            {stats.wired > 0 && (
              <Badge variant="outline" className="text-xs">
                {stats.wired} wired
              </Badge>
            )}
            <Badge variant="default" className="text-xs">
              {stats.playing} playing
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground flex-wrap">
          {hasDiagnostics ? (
            <>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-success" />
                <span>Good Signal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-warning" />
                <span>Fair Signal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-destructive" />
                <span>Poor Signal</span>
              </div>
              <div className="flex items-center gap-1">
                <Cable className="w-3 h-3" />
                <span>Wired</span>
              </div>
              <div className="flex items-center gap-1">
                <Radio className="w-3 h-3" />
                <span>SonosNet</span>
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                <span>WiFi</span>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Device Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {devices.map((device) => {
              const diag = diagnosticsMap.get(device.id);
              const isPlaying = device.playbackState === 'PLAYING';

              // Get styling based on diagnostics or fallback
              let styles: { bgClass: string; iconClass: string; icon?: React.ReactNode };
              if (diag) {
                styles = getSignalStyles(diag.signalQuality, isPlaying);
              } else {
                const fallback = getFallbackStyles(device);
                styles = { ...fallback, icon: undefined };
              }

              return (
                <Tooltip key={device.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/dashboard/diagnostics/${device.id}`}
                      className={cn(
                        'aspect-square rounded-lg flex flex-col items-center justify-center gap-1 p-2 transition-all cursor-pointer hover:scale-105',
                        styles.bgClass
                      )}
                    >
                      <div className="flex items-center gap-0.5">
                        <Speaker className={cn('w-4 h-4', styles.iconClass)} />
                        {diag && (
                          <ConnectionIcon type={diag.connectionType} />
                        )}
                      </div>
                      <span className="text-[10px] text-center truncate w-full px-1 text-muted-foreground">
                        {device.roomName.slice(0, 8)}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{device.roomName}</p>
                      <p className="text-xs text-muted-foreground">
                        {diag?.modelNumber || device.modelName}
                      </p>
                      {diag && (
                        <>
                          <p className="text-xs">
                            Connection:{' '}
                            {diag.connectionType === 'ethernet'
                              ? 'Wired (Ethernet)'
                              : diag.connectionType === 'sonosnet'
                              ? 'SonosNet'
                              : 'WiFi'}
                          </p>
                          <p className="text-xs">
                            Signal: {diag.signalQuality}
                            {diag.snr !== undefined && ` (${diag.snr} dB)`}
                          </p>
                          {diag.ipAddress && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {diag.ipAddress}
                            </p>
                          )}
                        </>
                      )}
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

        {/* Offline Devices Warning */}
        {stats.offline > 0 && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <p className="text-sm text-destructive flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              {stats.offline} device{stats.offline > 1 ? 's' : ''} offline or unreachable
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

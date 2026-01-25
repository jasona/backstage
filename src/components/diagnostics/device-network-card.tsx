'use client';

/**
 * Device network card component.
 * Shows network diagnostics for a single device including
 * connection type, signal strength, and status.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Speaker,
  Wifi,
  WifiOff,
  Cable,
  Radio,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import type { DeviceNetworkDiagnostics, SignalQuality, NetworkConnectionType } from '@/types/sonos';
import { getSignalQualityDescription } from '@/lib/sonos-device-api';

interface DeviceNetworkCardProps {
  device: DeviceNetworkDiagnostics;
}

function ConnectionBadge({ type }: { type: NetworkConnectionType }) {
  const variants: Record<NetworkConnectionType, { icon: React.ReactNode; label: string; className: string }> = {
    ethernet: {
      icon: <Cable className="w-3 h-3" />,
      label: 'Wired',
      className: 'bg-success/20 text-success border-success/30',
    },
    sonosnet: {
      icon: <Radio className="w-3 h-3" />,
      label: 'SonosNet',
      className: 'bg-primary/20 text-primary border-primary/30',
    },
    wifi: {
      icon: <Wifi className="w-3 h-3" />,
      label: 'WiFi',
      className: 'bg-muted text-muted-foreground border-border-subtle',
    },
    unknown: {
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Unknown',
      className: 'bg-muted text-muted-foreground border-border-subtle',
    },
  };

  const { icon, label, className } = variants[type];

  return (
    <Badge variant="outline" className={cn('flex items-center gap-1 text-xs', className)}>
      {icon}
      {label}
    </Badge>
  );
}

function SignalIndicator({ quality, snr }: { quality: SignalQuality; snr?: number }) {
  const indicators: Record<SignalQuality, { icon: React.ReactNode; className: string }> = {
    excellent: {
      icon: <SignalHigh className="w-4 h-4" />,
      className: 'text-success',
    },
    good: {
      icon: <SignalHigh className="w-4 h-4" />,
      className: 'text-success',
    },
    fair: {
      icon: <SignalMedium className="w-4 h-4" />,
      className: 'text-warning',
    },
    poor: {
      icon: <SignalLow className="w-4 h-4" />,
      className: 'text-destructive',
    },
    offline: {
      icon: <WifiOff className="w-4 h-4" />,
      className: 'text-muted-foreground',
    },
  };

  const { icon, className } = indicators[quality];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1', className)}>
            {icon}
            <span className="text-xs capitalize">{quality}</span>
            {snr !== undefined && (
              <span className="text-xs text-muted-foreground">({snr} dB)</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getSignalQualityDescription(quality)}</p>
          {snr !== undefined && <p className="text-xs text-muted-foreground">SNR: {snr} dB</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CopyableIP({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('IP address copied');
  }, [ip]);

  if (!ip) return <span className="text-muted-foreground">—</span>;

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs font-mono hover:text-primary transition-colors"
    >
      {ip}
      {copied ? (
        <Check className="w-3 h-3 text-success" />
      ) : (
        <Copy className="w-3 h-3 opacity-50" />
      )}
    </button>
  );
}

export function DeviceNetworkCard({ device }: DeviceNetworkCardProps) {
  const isOffline = !device.isReachable;

  return (
    <Card className={cn(
      'bg-surface border-border-subtle transition-all hover:border-border-subtle/80',
      isOffline && 'opacity-60'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Device Info */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              'p-2 rounded-lg',
              isOffline ? 'bg-muted/50 text-muted-foreground' : 'bg-primary/10 text-primary'
            )}>
              <Speaker className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground truncate">
                  {device.roomName}
                </h3>
                {isOffline && (
                  <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-2">
                {device.modelNumber !== 'Unknown' ? device.modelNumber : 'Sonos'}
                {device.softwareVersion !== 'Unknown' && ` • v${device.softwareVersion}`}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <ConnectionBadge type={device.connectionType} />
                {!isOffline && (
                  <SignalIndicator quality={device.signalQuality} snr={device.snr} />
                )}
              </div>
            </div>
          </div>

          {/* IP & Actions */}
          <div className="flex flex-col items-end gap-2">
            <CopyableIP ip={device.ipAddress} />

            <Link href={`/dashboard/diagnostics/${device.deviceId}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Details
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Warnings */}
        {!device.supportsSonosNet && device.isReachable && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              This device can only connect via WiFi
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DeviceNetworkCardSkeleton() {
  return (
    <Card className="bg-surface border-border-subtle">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton className="w-9 h-9 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-3 w-32 bg-muted" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full bg-muted" />
                <Skeleton className="h-5 w-20 bg-muted" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-muted" />
            <Skeleton className="h-7 w-16 bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

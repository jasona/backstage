'use client';

/**
 * Device detail diagnostics page.
 * Shows detailed information for a specific device including network diagnostics.
 */

import { use } from 'react';
import { Header } from '@/components/layout/header';
import { DeviceInfo } from '@/components/diagnostics/device-info';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDevices } from '@/hooks/use-sonos';
import { useDeviceNetworkDiagnostics } from '@/hooks/use-network-diagnostics';
import { useSonosConnection } from '@/providers/sonos-provider';
import { getConnectionTypeLabel } from '@/lib/sonos-device-api';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
  Cable,
  Radio,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { SignalQuality, NetworkConnectionType } from '@/types/sonos';

interface DeviceDetailPageProps {
  params: Promise<{ deviceId: string }>;
}

function CopyableText({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(`${label} copied`);
  }, [text, label]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 font-mono text-sm hover:text-primary transition-colors"
    >
      {text}
      {copied ? (
        <Check className="w-3 h-3 text-success" />
      ) : (
        <Copy className="w-3 h-3 opacity-50" />
      )}
    </button>
  );
}

function ConnectionIcon({ type }: { type: NetworkConnectionType }) {
  switch (type) {
    case 'ethernet':
      return <Cable className="w-5 h-5" />;
    case 'sonosnet':
      return <Radio className="w-5 h-5" />;
    case 'wifi':
      return <Wifi className="w-5 h-5" />;
    default:
      return <Wifi className="w-5 h-5" />;
  }
}

function SignalIcon({ quality }: { quality: SignalQuality }) {
  switch (quality) {
    case 'excellent':
    case 'good':
      return <SignalHigh className="w-5 h-5" />;
    case 'fair':
      return <SignalMedium className="w-5 h-5" />;
    case 'poor':
      return <SignalLow className="w-5 h-5" />;
    case 'offline':
      return <WifiOff className="w-5 h-5" />;
  }
}

function getSignalColor(quality: SignalQuality): string {
  switch (quality) {
    case 'excellent':
    case 'good':
      return 'text-success';
    case 'fair':
      return 'text-warning';
    case 'poor':
      return 'text-destructive';
    case 'offline':
      return 'text-muted-foreground';
  }
}

function NetworkDiagnosticsCard({
  deviceId,
  isLoading,
}: {
  deviceId: string;
  isLoading: boolean;
}) {
  const { device: diag, isLoading: diagLoading } = useDeviceNetworkDiagnostics(deviceId);

  if (isLoading || diagLoading) {
    return (
      <Card className="bg-surface border-border-subtle">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Network Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-4 w-32 bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!diag) {
    return (
      <Card className="bg-surface border-border-subtle">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Network Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Network diagnostics unavailable for this device.
          </p>
        </CardContent>
      </Card>
    );
  }

  const signalColor = getSignalColor(diag.signalQuality);

  return (
    <Card className="bg-surface border-border-subtle">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Network Diagnostics
          </CardTitle>
          {!diag.isReachable && (
            <Badge variant="outline" className="border-destructive/30 text-destructive">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Type */}
        <div className="flex items-center justify-between py-2 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ConnectionIcon type={diag.connectionType} />
            <span className="text-sm">Connection Type</span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-sm',
              diag.connectionType === 'ethernet' && 'bg-success/20 text-success border-success/30',
              diag.connectionType === 'sonosnet' && 'bg-primary/20 text-primary border-primary/30'
            )}
          >
            {getConnectionTypeLabel(diag.connectionType)}
          </Badge>
        </div>

        {/* Signal Quality */}
        <div className="flex items-center justify-between py-2 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-muted-foreground">
            <SignalIcon quality={diag.signalQuality} />
            <span className="text-sm">Signal Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium capitalize', signalColor)}>
              {diag.signalQuality}
            </span>
            {diag.snr !== undefined && (
              <span className="text-xs text-muted-foreground">({diag.snr} dB)</span>
            )}
          </div>
        </div>

        {/* IP Address */}
        {diag.ipAddress && (
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Signal className="w-5 h-5" />
              <span className="text-sm">IP Address</span>
            </div>
            <CopyableText text={diag.ipAddress} label="IP Address" />
          </div>
        )}

        {/* MAC Address */}
        {diag.macAddress && (
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Cable className="w-5 h-5" />
              <span className="text-sm">MAC Address</span>
            </div>
            <CopyableText text={diag.macAddress} label="MAC Address" />
          </div>
        )}

        {/* Software Version */}
        <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="w-5 h-5" />
            <span className="text-sm">Software Version</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {diag.softwareVersion !== 'Unknown' ? diag.softwareVersion : '—'}
          </span>
        </div>

        {/* Troubleshooting Tips */}
        {(diag.signalQuality === 'poor' || diag.signalQuality === 'fair') && (
          <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/30">
            <h4 className="text-sm font-medium text-warning flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" />
              Troubleshooting Tips
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Move the device closer to your router or a wired Sonos speaker</li>
              <li>• Reduce interference from other wireless devices</li>
              <li>• Consider connecting a Sonos speaker to your router with ethernet</li>
              {!diag.supportsSonosNet && (
                <li>• This device can only use WiFi - ensure good WiFi coverage</li>
              )}
            </ul>
          </div>
        )}

        {!diag.isReachable && (
          <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
            <h4 className="text-sm font-medium text-destructive flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" />
              Device Offline
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Check that the device is powered on</li>
              <li>• Verify your network connection</li>
              <li>• Try unplugging the device for 10 seconds and plugging it back in</li>
              <li>• Check the Sonos app for additional troubleshooting</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DeviceDetailPage({ params }: DeviceDetailPageProps) {
  const { deviceId } = use(params);
  const { devices, isLoading, refetch } = useDevices();
  const { refetch: refetchDiagnostics } = useDeviceNetworkDiagnostics(deviceId);
  const { connectionStatus } = useSonosConnection();

  const device = devices.find((d) => d.id === deviceId);

  const handleRefresh = () => {
    refetch();
    refetchDiagnostics();
  };

  if (!isLoading && !device) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          title="Device Not Found"
          description=""
          connectionStatus={connectionStatus}
        >
          <Link href="/dashboard/diagnostics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Diagnostics
            </Button>
          </Link>
        </Header>

        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Device Not Found
            </h2>
            <p className="text-muted-foreground mb-4">
              The device you&apos;re looking for may have been disconnected or moved.
            </p>
            <Link href="/dashboard/diagnostics">
              <Button>Return to Diagnostics</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={device?.roomName || 'Loading...'}
        description={device?.modelName || ''}
        connectionStatus={connectionStatus}
      >
        <Link href="/dashboard/diagnostics">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </Header>

      <main className="flex-1 p-6 overflow-auto space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Device Info */}
          <DeviceInfo device={device} isLoading={isLoading} />

          {/* Network Diagnostics */}
          <NetworkDiagnosticsCard deviceId={deviceId} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}

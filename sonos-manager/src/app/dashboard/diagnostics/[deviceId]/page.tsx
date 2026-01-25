'use client';

/**
 * Device detail diagnostics page.
 * Shows detailed information for a specific device.
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { DeviceInfo } from '@/components/diagnostics/device-info';
import { Button } from '@/components/ui/button';
import { useDevices } from '@/hooks/use-sonos';
import { useSonosConnection } from '@/providers/sonos-provider';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface DeviceDetailPageProps {
  params: Promise<{ deviceId: string }>;
}

export default function DeviceDetailPage({ params }: DeviceDetailPageProps) {
  const { deviceId } = use(params);
  const router = useRouter();
  const { devices, isLoading, refetch } = useDevices();
  const { connectionStatus } = useSonosConnection();

  const device = devices.find((d) => d.id === deviceId);

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
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </Header>

      <main className="flex-1 p-6 overflow-auto">
        <DeviceInfo device={device} isLoading={isLoading} />
      </main>
    </div>
  );
}

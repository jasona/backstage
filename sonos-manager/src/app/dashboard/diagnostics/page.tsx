'use client';

/**
 * Diagnostics page showing device information and network status.
 */

import { Header } from '@/components/layout/header';
import { DeviceList } from '@/components/diagnostics/device-list';
import { NetworkMatrix } from '@/components/diagnostics/network-matrix';
import { Button } from '@/components/ui/button';
import { useDevices } from '@/hooks/use-sonos';
import { useSonosConnection } from '@/providers/sonos-provider';
import { RefreshCw } from 'lucide-react';

export default function DiagnosticsPage() {
  const { devices, isLoading, refetch } = useDevices();
  const { connectionStatus } = useSonosConnection();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Diagnostics"
        description={`${devices.length} devices connected`}
        connectionStatus={connectionStatus}
      >
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

      <main className="flex-1 p-6 overflow-auto space-y-6">
        {/* Network Matrix */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Network Overview
          </h2>
          <NetworkMatrix devices={devices} isLoading={isLoading} />
        </section>

        {/* Device List */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Device Information
          </h2>
          <DeviceList devices={devices} isLoading={isLoading} />
        </section>
      </main>
    </div>
  );
}

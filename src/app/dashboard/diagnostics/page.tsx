'use client';

/**
 * Diagnostics page showing network health and device information.
 */

import { Header } from '@/components/layout/header';
import { DeviceList } from '@/components/diagnostics/device-list';
import { NetworkMatrix } from '@/components/diagnostics/network-matrix';
import { NetworkOverview } from '@/components/diagnostics/network-overview';
import { IssuesPanel } from '@/components/diagnostics/issues-panel';
import { DeviceNetworkCard, DeviceNetworkCardSkeleton } from '@/components/diagnostics/device-network-card';
import { Button } from '@/components/ui/button';
import { useDevices } from '@/hooks/use-sonos';
import { useNetworkDiagnostics, useNetworkHealth } from '@/hooks/use-network-diagnostics';
import { useSonosConnection } from '@/providers/sonos-provider';
import { RefreshCw, Activity } from 'lucide-react';

export default function DiagnosticsPage() {
  const { devices, isLoading: devicesLoading, refetch: refetchDevices } = useDevices();
  const { connectionStatus } = useSonosConnection();
  const {
    data: diagnostics,
    isLoading: diagnosticsLoading,
    refetch: refetchDiagnostics,
  } = useNetworkDiagnostics();
  const { health, isLoading: healthLoading } = useNetworkHealth();

  const isLoading = devicesLoading || diagnosticsLoading;

  const handleRefresh = () => {
    refetchDevices();
    refetchDiagnostics();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Network Diagnostics"
        description={
          health
            ? `${health.onlineDevices} of ${health.totalDevices} devices online`
            : `${devices.length} devices`
        }
        connectionStatus={connectionStatus}
      >
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
        {/* Network Health Overview */}
        <section>
          <NetworkOverview health={health} isLoading={healthLoading} />
        </section>

        {/* Issues Panel (only shown if there are issues) */}
        {(health?.issues.length ?? 0) > 0 && (
          <section>
            <IssuesPanel
              issues={health?.issues ?? []}
              isLoading={healthLoading}
            />
          </section>
        )}

        {/* Network Matrix */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Device Network Map
          </h2>
          <NetworkMatrix
            devices={devices}
            diagnostics={diagnostics?.devices}
            isLoading={devicesLoading}
          />
        </section>

        {/* Device Network Cards */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Device Details
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {diagnosticsLoading ? (
              <>
                {[...Array(6)].map((_, i) => (
                  <DeviceNetworkCardSkeleton key={i} />
                ))}
              </>
            ) : diagnostics?.devices.length ? (
              diagnostics.devices.map((device) => (
                <DeviceNetworkCard key={device.deviceId} device={device} />
              ))
            ) : (
              // Fallback to basic device list if no diagnostics
              <div className="md:col-span-2 lg:col-span-3">
                <DeviceList devices={devices} isLoading={devicesLoading} />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

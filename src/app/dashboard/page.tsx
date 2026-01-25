'use client';

/**
 * Main dashboard page showing all devices.
 */

import { Header } from '@/components/layout/header';
import { DeviceGrid } from '@/components/dashboard/device-grid';
import { BulkActions } from '@/components/dashboard/bulk-actions';
import { useDevices } from '@/hooks/use-sonos';
import { useSonosConnection } from '@/providers/sonos-provider';

export default function DashboardPage() {
  const { devices } = useDevices();
  const { connectionStatus } = useSonosConnection();

  const playingCount = devices.filter((d) => d.playbackState === 'PLAYING').length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Dashboard"
        description={`${devices.length} devices${playingCount > 0 ? ` • ${playingCount} playing` : ''}`}
        connectionStatus={connectionStatus}
      >
        <BulkActions />
      </Header>

      <main className="flex-1 p-6 overflow-auto">
        <DeviceGrid />
      </main>
    </div>
  );
}

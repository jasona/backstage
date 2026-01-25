'use client';

/**
 * Main dashboard page showing all devices.
 */

import { Header } from '@/components/layout/header';
import { DeviceGrid } from '@/components/dashboard/device-grid';
import { Button } from '@/components/ui/button';
import { usePauseAll, useResumeAll, useDevices } from '@/hooks/use-sonos';
import { useSonosConnection } from '@/providers/sonos-provider';
import { Pause, Play } from 'lucide-react';

export default function DashboardPage() {
  const { devices } = useDevices();
  const { connectionStatus } = useSonosConnection();
  const pauseAllMutation = usePauseAll();
  const resumeAllMutation = useResumeAll();

  const playingCount = devices.filter((d) => d.playbackState === 'PLAYING').length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Dashboard"
        description={`${devices.length} devices${playingCount > 0 ? ` • ${playingCount} playing` : ''}`}
        connectionStatus={connectionStatus}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => pauseAllMutation.mutate()}
          disabled={pauseAllMutation.isPending}
        >
          <Pause className="w-4 h-4 mr-2" />
          Pause All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => resumeAllMutation.mutate()}
          disabled={resumeAllMutation.isPending}
        >
          <Play className="w-4 h-4 mr-2" />
          Resume All
        </Button>
      </Header>

      <main className="flex-1 p-6 overflow-auto">
        <DeviceGrid />
      </main>
    </div>
  );
}

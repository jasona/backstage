'use client';

/**
 * Groups page - manage Sonos device groups with drag-and-drop.
 */

import { Header } from '@/components/layout/header';
import { GroupsContainer } from '@/components/groups/groups-container';
import { useZoneStatuses } from '@/hooks/use-sonos';
import { useSonosConnection } from '@/providers/sonos-provider';

export default function GroupsPage() {
  const { zoneStatuses } = useZoneStatuses();
  const { connectionStatus } = useSonosConnection();

  // Count grouped zones (zones with more than 1 member)
  const groupedCount = zoneStatuses.filter((z) => z.memberIds.length > 1).length;
  const totalDevices = zoneStatuses.reduce((sum, z) => sum + z.memberIds.length, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Groups"
        description={`${totalDevices} devices${groupedCount > 0 ? ` in ${groupedCount} group${groupedCount !== 1 ? 's' : ''}` : ''}`}
        connectionStatus={connectionStatus}
      />

      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        <GroupsContainer />
      </main>
    </div>
  );
}

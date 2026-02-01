'use client';

/**
 * A droppable zone representing a Sonos group.
 * Contains group header, controls, and draggable device cards.
 */

import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GroupHeader } from './group-header';
import { GroupControls } from './group-controls';
import { DraggableDevice } from './draggable-device';
import { cn } from '@/lib/utils';
import type { DeviceStatus, ZoneStatus } from '@/types/sonos';

interface GroupZoneProps {
  zone: ZoneStatus;
  devices: DeviceStatus[];
  onPlayPause?: (roomName: string) => void;
  onNext?: (roomName: string) => void;
  onPrevious?: (roomName: string) => void;
  onGroupVolumeChange?: (roomName: string, volume: number) => void;
  onDeviceVolumeChange?: (roomName: string, volume: number) => void;
  onToggleMute?: (roomName: string) => void;
  onPickMusic?: (roomName: string) => void;
  isPlayPauseLoading?: boolean;
  isNextLoading?: boolean;
  isPreviousLoading?: boolean;
}

export function GroupZone({
  zone,
  devices,
  onPlayPause,
  onNext,
  onPrevious,
  onGroupVolumeChange,
  onDeviceVolumeChange,
  onToggleMute,
  onPickMusic,
  isPlayPauseLoading,
  isNextLoading,
  isPreviousLoading,
}: GroupZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `group-${zone.id}`,
    data: { zone, type: 'group' },
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'w-[300px] flex-shrink-0 bg-surface border-border-subtle transition-all duration-200 flex flex-col',
        isOver && 'ring-2 ring-primary border-primary/50 bg-primary/5'
      )}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <GroupHeader zone={zone} />
      </CardHeader>

      <CardContent className="space-y-4 pt-0 flex-1 flex flex-col min-h-0">
        {/* Group Controls */}
        <div className="flex-shrink-0">
          <GroupControls
            zone={zone}
            onPlayPause={onPlayPause}
            onNext={onNext}
            onPrevious={onPrevious}
            onGroupVolumeChange={onGroupVolumeChange}
            onToggleMute={onToggleMute}
            onPickMusic={onPickMusic}
            isPlayPauseLoading={isPlayPauseLoading}
            isNextLoading={isNextLoading}
            isPreviousLoading={isPreviousLoading}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border-subtle flex-shrink-0" />

        {/* Device List */}
        <div className="space-y-2 overflow-y-auto p-1 -m-1 flex-1 min-h-0">
          {devices.map((device) => (
            <DraggableDevice
              key={device.id}
              device={device}
              onVolumeChange={onDeviceVolumeChange}
              onToggleMute={onToggleMute}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

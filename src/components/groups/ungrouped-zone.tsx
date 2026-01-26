'use client';

/**
 * Drop zone for ungrouped devices.
 * Devices dropped here will leave their current group.
 */

import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DraggableDevice } from './draggable-device';
import { cn } from '@/lib/utils';
import { Unlink } from 'lucide-react';
import type { DeviceStatus } from '@/types/sonos';

interface UngroupedZoneProps {
  devices: DeviceStatus[];
  onVolumeChange?: (roomName: string, volume: number) => void;
  onToggleMute?: (roomName: string) => void;
  onPlayPause?: (roomName: string) => void;
  onNext?: (roomName: string) => void;
  onPrevious?: (roomName: string) => void;
  onPickMusic?: (roomName: string) => void;
  playPauseLoadingRoom?: string;
  nextLoadingRoom?: string;
  previousLoadingRoom?: string;
}

export function UngroupedZone({
  devices,
  onVolumeChange,
  onToggleMute,
  onPlayPause,
  onNext,
  onPrevious,
  onPickMusic,
  playPauseLoadingRoom,
  nextLoadingRoom,
  previousLoadingRoom,
}: UngroupedZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'ungrouped',
    data: { type: 'ungrouped' },
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'w-[300px] flex-shrink-0 bg-surface/50 border-border-subtle border-dashed transition-all duration-200 flex flex-col',
        isOver && 'ring-2 ring-primary border-primary/50 bg-primary/5 border-solid'
      )}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
          <Unlink className="w-4 h-4" />
          Ungrouped
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {devices.length === 0
            ? 'Drop devices here to remove from groups'
            : `${devices.length} ungrouped speaker${devices.length !== 1 ? 's' : ''}`}
        </p>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
        {devices.length > 0 ? (
          <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
            {devices.map((device) => (
              <DraggableDevice
                key={device.id}
                device={device}
                isDroppable={true}
                showPlaybackControls={true}
                onVolumeChange={onVolumeChange}
                onToggleMute={onToggleMute}
                onPlayPause={onPlayPause}
                onNext={onNext}
                onPrevious={onPrevious}
                onPickMusic={onPickMusic}
                isPlayPauseLoading={playPauseLoadingRoom === device.roomName}
                isNextLoading={nextLoadingRoom === device.roomName}
                isPreviousLoading={previousLoadingRoom === device.roomName}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Unlink className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              All speakers are grouped
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

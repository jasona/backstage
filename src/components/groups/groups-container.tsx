'use client';

/**
 * Main container for the groups page.
 * Handles DnD context, drag events, and layout.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { GroupZone } from './group-zone';
import { UngroupedZone } from './ungrouped-zone';
import { DraggableDeviceOverlay } from './draggable-device';
import { MusicPicker } from '@/components/dashboard/music-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  useDevices,
  useZoneStatuses,
  usePlayPause,
  useNext,
  usePrevious,
  useVolume,
  useGroupVolume,
  useToggleMute,
  useJoinGroup,
  useLeaveGroup,
} from '@/hooks/use-sonos';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw, Speaker } from 'lucide-react';
import type { DeviceStatus, ZoneStatus } from '@/types/sonos';

// Represents a pending move operation for optimistic UI
interface PendingMove {
  deviceId: string;
  targetZoneId: string | null; // null means ungrouped
}

export function GroupsContainer() {
  const { devices, isLoading, isError, error, refetch } = useDevices();
  const { zoneStatuses } = useZoneStatuses();

  // Mutations
  const playPauseMutation = usePlayPause();
  const nextMutation = useNext();
  const previousMutation = usePrevious();
  const volumeMutation = useVolume();
  const groupVolumeMutation = useGroupVolume();
  const toggleMuteMutation = useToggleMute();
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();

  // Track active drag item
  const [activeDevice, setActiveDevice] = useState<DeviceStatus | null>(null);

  // Track pending moves for optimistic UI updates
  const [pendingMoves, setPendingMoves] = useState<PendingMove[]>([]);

  // Track which room to show the music picker for
  const [musicPickerRoom, setMusicPickerRoom] = useState<string | null>(null);

  // Clear pending moves when server data updates and matches our expected state
  useEffect(() => {
    if (pendingMoves.length === 0) return;

    // Check if all pending moves are now reflected in the server data
    const allMovesComplete = pendingMoves.every((move) => {
      const device = devices.find((d) => d.id === move.deviceId);
      if (!device) return true; // Device gone, consider complete

      if (move.targetZoneId === null) {
        // Should be ungrouped (in a zone with only itself)
        const zone = zoneStatuses.find((z) => z.id === device.groupId);
        return zone && zone.memberIds.length === 1;
      } else {
        // Should be in the target zone
        return device.groupId === move.targetZoneId;
      }
    });

    if (allMovesComplete) {
      setPendingMoves([]);
    }
  }, [devices, zoneStatuses, pendingMoves]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Apply pending moves to create optimistic device list
  const optimisticDevices = useMemo(() => {
    if (pendingMoves.length === 0) return devices;

    return devices.map((device) => {
      const pendingMove = pendingMoves.find((m) => m.deviceId === device.id);
      if (!pendingMove) return device;

      // Create a new groupId for the device based on the pending move
      if (pendingMove.targetZoneId === null) {
        // Moving to ungrouped - use device's own ID as group
        return { ...device, groupId: device.id, isCoordinator: true };
      } else {
        // Moving to a group
        return { ...device, groupId: pendingMove.targetZoneId, isCoordinator: false };
      }
    });
  }, [devices, pendingMoves]);

  // Create optimistic zone statuses
  const optimisticZoneStatuses = useMemo(() => {
    if (pendingMoves.length === 0) return zoneStatuses;

    // Start with current zones and modify based on pending moves
    const zonesMap = new Map<string, ZoneStatus>();

    // Initialize with current zones
    for (const zone of zoneStatuses) {
      zonesMap.set(zone.id, { ...zone, memberIds: [...zone.memberIds], memberRooms: [...zone.memberRooms] });
    }

    for (const move of pendingMoves) {
      const device = devices.find((d) => d.id === move.deviceId);
      if (!device) continue;

      // Remove device from its current zone
      const currentZone = zonesMap.get(device.groupId);
      if (currentZone) {
        currentZone.memberIds = currentZone.memberIds.filter((id) => id !== device.id);
        currentZone.memberRooms = currentZone.memberRooms.filter((room) => room !== device.roomName);

        // If zone is now empty or has only coordinator, we might need to handle it
        if (currentZone.memberIds.length === 0) {
          zonesMap.delete(device.groupId);
        }
      }

      if (move.targetZoneId === null) {
        // Create a new single-device zone for ungrouped device
        zonesMap.set(device.id, {
          id: device.id,
          coordinatorId: device.id,
          coordinatorRoom: device.roomName,
          memberIds: [device.id],
          memberRooms: [device.roomName],
          volume: device.volume,
          muted: device.muted,
          playbackState: device.playbackState,
          nowPlaying: device.nowPlaying,
        });
      } else {
        // Add device to target zone
        const targetZone = zonesMap.get(move.targetZoneId);
        if (targetZone) {
          targetZone.memberIds.push(device.id);
          targetZone.memberRooms.push(device.roomName);
        }
      }
    }

    return Array.from(zonesMap.values());
  }, [zoneStatuses, devices, pendingMoves]);

  // Group devices by zone (using optimistic data)
  const groupedDevices = useMemo(() => {
    const groups = new Map<string, DeviceStatus[]>();

    for (const zone of optimisticZoneStatuses) {
      const zoneDevices = optimisticDevices.filter(
        (d) => d.groupId === zone.id
      );
      groups.set(zone.id, zoneDevices);
    }

    return groups;
  }, [optimisticDevices, optimisticZoneStatuses]);

  // Get ungrouped devices (devices in zones with only 1 member)
  const ungroupedDevices = useMemo(() => {
    return optimisticDevices.filter((d) => {
      const zone = optimisticZoneStatuses.find((z) => z.id === d.groupId);
      return zone && zone.memberIds.length === 1;
    });
  }, [optimisticDevices, optimisticZoneStatuses]);

  // Get grouped zones (zones with more than 1 member)
  const groupedZones = useMemo(() => {
    return optimisticZoneStatuses.filter((z) => z.memberIds.length > 1);
  }, [optimisticZoneStatuses]);

  // Handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const device = event.active.data.current?.device as DeviceStatus | undefined;
    if (device) {
      setActiveDevice(device);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDevice(null);

      const { active, over } = event;
      if (!over || !active.data.current?.device) return;

      const device = active.data.current.device as DeviceStatus;
      const dropTarget = over.data.current;

      // Determine action based on drop target
      if (dropTarget?.type === 'ungrouped') {
        // Device dropped on ungrouped zone - leave group
        const currentZone = zoneStatuses.find((z) => z.id === device.groupId);
        if (currentZone && currentZone.memberIds.length > 1) {
          // Add optimistic move
          setPendingMoves((prev) => [
            ...prev.filter((m) => m.deviceId !== device.id),
            { deviceId: device.id, targetZoneId: null },
          ]);

          // Fire mutation (don't await)
          leaveGroupMutation.mutate(device.roomName, {
            onSuccess: () => {
              toast.success(`${device.roomName} removed from group`);
            },
            onError: (err) => {
              // Remove pending move on error
              setPendingMoves((prev) => prev.filter((m) => m.deviceId !== device.id));
              toast.error(`Failed to remove ${device.roomName} from group`);
              console.error('Leave group error:', err);
            },
          });
        }
      } else if (dropTarget?.type === 'device' && dropTarget.device) {
        // Device dropped on another device - create new group
        const targetDevice = dropTarget.device as DeviceStatus;

        // Don't drop on self
        if (device.id === targetDevice.id) return;

        // Don't join if already in the same group
        if (device.groupId === targetDevice.groupId) return;

        // Add optimistic move - join the target device's zone (which will become a group)
        setPendingMoves((prev) => [
          ...prev.filter((m) => m.deviceId !== device.id),
          { deviceId: device.id, targetZoneId: targetDevice.groupId },
        ]);

        // Fire mutation - join the dragged device to the target device's room
        joinGroupMutation.mutate(
          { roomName: device.roomName, targetRoom: targetDevice.roomName },
          {
            onSuccess: () => {
              toast.success(`Created group: ${targetDevice.roomName} + ${device.roomName}`);
            },
            onError: (err) => {
              // Remove pending move on error
              setPendingMoves((prev) => prev.filter((m) => m.deviceId !== device.id));
              toast.error(`Failed to create group`);
              console.error('Join group error:', err);
            },
          }
        );
      } else if (dropTarget?.type === 'group' && dropTarget.zone) {
        // Device dropped on a group zone - join group
        const targetZone = dropTarget.zone as ZoneStatus;
        const targetRoom = targetZone.coordinatorRoom;

        // Don't join if already in this group
        if (device.groupId === targetZone.id) return;

        // Add optimistic move
        setPendingMoves((prev) => [
          ...prev.filter((m) => m.deviceId !== device.id),
          { deviceId: device.id, targetZoneId: targetZone.id },
        ]);

        // Fire mutation (don't await)
        joinGroupMutation.mutate(
          { roomName: device.roomName, targetRoom },
          {
            onSuccess: () => {
              toast.success(`${device.roomName} joined ${targetRoom}`);
            },
            onError: (err) => {
              // Remove pending move on error
              setPendingMoves((prev) => prev.filter((m) => m.deviceId !== device.id));
              toast.error(`Failed to add ${device.roomName} to group`);
              console.error('Join group error:', err);
            },
          }
        );
      }
    },
    [zoneStatuses, joinGroupMutation, leaveGroupMutation]
  );

  const handlePlayPause = useCallback(
    (roomName: string) => {
      playPauseMutation.mutate(roomName);
    },
    [playPauseMutation]
  );

  const handleNext = useCallback(
    (roomName: string) => {
      nextMutation.mutate(roomName);
    },
    [nextMutation]
  );

  const handlePrevious = useCallback(
    (roomName: string) => {
      previousMutation.mutate(roomName);
    },
    [previousMutation]
  );

  const handleGroupVolumeChange = useCallback(
    (roomName: string, volume: number) => {
      groupVolumeMutation.mutate({ roomName, volume });
    },
    [groupVolumeMutation]
  );

  const handleDeviceVolumeChange = useCallback(
    (roomName: string, volume: number) => {
      volumeMutation.mutate({ roomName, volume });
    },
    [volumeMutation]
  );

  const handleToggleMute = useCallback(
    (roomName: string) => {
      toggleMuteMutation.mutate(roomName);
    },
    [toggleMuteMutation]
  );

  const handlePickMusic = useCallback((roomName: string) => {
    setMusicPickerRoom(roomName);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="w-[300px] flex-shrink-0 bg-surface border-border-subtle">
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-6 w-32 bg-muted" />
              <Skeleton className="h-4 w-24 bg-muted" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full bg-muted" />
                <Skeleton className="h-4 w-full bg-muted" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-16 w-full bg-muted" />
                <Skeleton className="h-16 w-full bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Failed to load devices
        </h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          {error?.message || 'Could not connect to the Sonos backend.'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Speaker className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No devices found
        </h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          Make sure your Sonos devices are on the same network and the backend is running.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
        {/* Grouped zones */}
        {groupedZones.map((zone) => (
          <GroupZone
            key={zone.id}
            zone={zone}
            devices={groupedDevices.get(zone.id) || []}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onGroupVolumeChange={handleGroupVolumeChange}
            onDeviceVolumeChange={handleDeviceVolumeChange}
            onToggleMute={handleToggleMute}
            onPickMusic={handlePickMusic}
            isPlayPauseLoading={
              playPauseMutation.isPending &&
              playPauseMutation.variables === zone.coordinatorRoom
            }
            isNextLoading={
              nextMutation.isPending &&
              nextMutation.variables === zone.coordinatorRoom
            }
            isPreviousLoading={
              previousMutation.isPending &&
              previousMutation.variables === zone.coordinatorRoom
            }
          />
        ))}

        {/* Ungrouped zone */}
        <UngroupedZone
          devices={ungroupedDevices}
          onVolumeChange={handleDeviceVolumeChange}
          onToggleMute={handleToggleMute}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onPickMusic={handlePickMusic}
          playPauseLoadingRoom={playPauseMutation.isPending ? playPauseMutation.variables : undefined}
          nextLoadingRoom={nextMutation.isPending ? nextMutation.variables : undefined}
          previousLoadingRoom={previousMutation.isPending ? previousMutation.variables : undefined}
        />
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDevice && <DraggableDeviceOverlay device={activeDevice} />}
      </DragOverlay>

      {/* Music Picker Dialog */}
      {musicPickerRoom && (
        <MusicPicker
          roomName={musicPickerRoom}
          open={!!musicPickerRoom}
          onOpenChange={(open) => !open && setMusicPickerRoom(null)}
        />
      )}
    </DndContext>
  );
}

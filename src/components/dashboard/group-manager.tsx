'use client';

/**
 * Group manager component for managing device grouping.
 * Allows adding/removing devices from groups.
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useJoinGroup, useLeaveGroup, useZoneStatuses, useDevices } from '@/hooks/use-sonos';
import { Users, Plus, Minus, Crown, Loader2, Unlink } from 'lucide-react';
import type { DeviceStatus, ZoneStatus } from '@/types/sonos';

interface GroupManagerProps {
  /** The device being managed */
  device: DeviceStatus;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
}

export function GroupManager({ device, open, onOpenChange }: GroupManagerProps) {
  const { devices } = useDevices();
  const { zoneStatuses } = useZoneStatuses();
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();

  const [selectedAction, setSelectedAction] = useState<'join' | 'leave' | null>(null);

  // Find the current zone this device belongs to
  const currentZone = zoneStatuses.find((z) =>
    z.coordinatorId === device.id || z.memberIds.includes(device.id)
  );

  // Get other zones this device could join
  const otherZones = zoneStatuses.filter((z) => z.id !== currentZone?.id);

  // Get ungrouped devices (single-member zones) that could be grouped with this device
  const ungroupedDevices = devices.filter((d) => {
    const zone = zoneStatuses.find((z) =>
      z.coordinatorId === d.id || z.memberIds.includes(d.id)
    );
    return zone && zone.memberIds.length <= 1 && d.id !== device.id;
  });

  // Check if this device is in a group (more than 1 member)
  const isInGroup = currentZone && currentZone.memberIds.length > 1;

  // Handle joining a group
  const handleJoinGroup = useCallback(
    async (targetRoom: string) => {
      try {
        await joinGroupMutation.mutateAsync({
          roomName: device.roomName,
          targetRoom,
        });
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to join group:', error);
      }
    },
    [device.roomName, joinGroupMutation, onOpenChange]
  );

  // Handle leaving a group
  const handleLeaveGroup = useCallback(async () => {
    try {
      await leaveGroupMutation.mutateAsync(device.roomName);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  }, [device.roomName, leaveGroupMutation, onOpenChange]);

  // Handle adding a device to this device's group
  const handleAddToGroup = useCallback(
    async (targetDevice: DeviceStatus) => {
      try {
        await joinGroupMutation.mutateAsync({
          roomName: targetDevice.roomName,
          targetRoom: device.roomName,
        });
      } catch (error) {
        console.error('Failed to add device to group:', error);
      }
    },
    [device.roomName, joinGroupMutation]
  );

  const isLoading = joinGroupMutation.isPending || leaveGroupMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-border-subtle max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group: {device.roomName}
          </DialogTitle>
          <DialogDescription>
            Manage group membership for this speaker.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Group Status */}
          <div className="p-3 rounded-lg bg-base border border-border-subtle">
            <div className="text-sm font-medium text-foreground mb-2">Current Status</div>
            {isInGroup ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {device.isCoordinator ? (
                    <>
                      <Crown className="w-4 h-4 text-primary" />
                      <span>Leading group with {currentZone!.memberIds.length - 1} other{currentZone!.memberIds.length > 2 ? 's' : ''}</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Grouped with {currentZone!.coordinatorRoom}</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {currentZone!.memberRooms.map((room) => (
                    <Badge
                      key={room}
                      variant={room === device.roomName ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {room === currentZone!.coordinatorRoom && (
                        <Crown className="w-3 h-3 mr-1" />
                      )}
                      {room}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Not grouped with any other speakers
              </div>
            )}
          </div>

          {/* Leave Group Button */}
          {isInGroup && (
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLeaveGroup}
              disabled={isLoading}
            >
              {leaveGroupMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4 mr-2" />
              )}
              Leave Group
            </Button>
          )}

          {/* Join Existing Group */}
          {otherZones.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Join Existing Group</div>
              <div className="space-y-1">
                {otherZones.map((zone) => (
                  <Button
                    key={zone.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleJoinGroup(zone.coordinatorRoom)}
                    disabled={isLoading}
                  >
                    {joinGroupMutation.isPending &&
                    joinGroupMutation.variables?.targetRoom === zone.coordinatorRoom ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    <span className="truncate">{zone.coordinatorRoom}</span>
                    {zone.memberIds.length > 1 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        +{zone.memberIds.length - 1}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Add Ungrouped Devices */}
          {ungroupedDevices.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">
                Add Speaker to This Group
              </div>
              <div className="space-y-1">
                {ungroupedDevices.map((d) => (
                  <Button
                    key={d.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddToGroup(d)}
                    disabled={isLoading}
                  >
                    {joinGroupMutation.isPending &&
                    joinGroupMutation.variables?.roomName === d.roomName ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    <span className="truncate">{d.roomName}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {otherZones.length === 0 && ungroupedDevices.length === 0 && !isInGroup && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No other speakers available to group with.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

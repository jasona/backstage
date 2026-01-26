'use client';

/**
 * Global command palette component.
 * Provides quick access to actions and navigation.
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  useDevices,
  useZoneStatuses,
  usePauseAll,
  useResumeAll,
  usePlayPause,
  useSetAllVolume,
  useLeaveGroup,
} from '@/hooks/use-sonos';
import {
  Pause,
  Play,
  Speaker,
  Settings,
  Activity,
  Volume2,
  VolumeX,
  Home,
  Search,
  Users,
  Unlink,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { devices } = useDevices();
  const { zoneStatuses } = useZoneStatuses();
  const pauseAllMutation = usePauseAll();
  const resumeAllMutation = useResumeAll();
  const playPauseMutation = usePlayPause();
  const setAllVolumeMutation = useSetAllVolume();
  const leaveGroupMutation = useLeaveGroup();

  // Get playing devices
  const playingDevices = useMemo(
    () => devices.filter((d) => d.playbackState === 'PLAYING'),
    [devices]
  );

  const pausedDevices = useMemo(
    () => devices.filter((d) => d.playbackState === 'PAUSED_PLAYBACK'),
    [devices]
  );

  // Get grouped devices (devices that are members of a group with more than 1 member)
  const groupedDevices = useMemo(() => {
    return devices.filter((d) => {
      const zone = zoneStatuses.find(
        (z) => z.coordinatorId === d.id || z.memberIds.includes(d.id)
      );
      return zone && zone.memberIds.length > 1;
    });
  }, [devices, zoneStatuses]);

  // Check if there are any groups
  const hasGroups = useMemo(() => {
    return zoneStatuses.some((z) => z.memberIds.length > 1);
  }, [zoneStatuses]);

  // Close palette helper
  const closeAndRun = useCallback(
    (action: () => void) => {
      onOpenChange(false);
      action();
    },
    [onOpenChange]
  );

  // Navigation actions
  const handleNavigate = useCallback(
    (path: string) => {
      closeAndRun(() => router.push(path));
    },
    [closeAndRun, router]
  );

  // Playback actions
  const handlePauseAll = useCallback(() => {
    closeAndRun(() => pauseAllMutation.mutate());
  }, [closeAndRun, pauseAllMutation]);

  const handleResumeAll = useCallback(() => {
    closeAndRun(() => resumeAllMutation.mutate());
  }, [closeAndRun, resumeAllMutation]);

  const handlePlayPause = useCallback(
    (roomName: string) => {
      closeAndRun(() => playPauseMutation.mutate(roomName));
    },
    [closeAndRun, playPauseMutation]
  );

  // Volume actions
  const handleSetAllVolume = useCallback(
    (volume: number) => {
      closeAndRun(() => setAllVolumeMutation.mutate(volume));
    },
    [closeAndRun, setAllVolumeMutation]
  );

  // Ungroup all devices
  const handleUngroupAll = useCallback(async () => {
    onOpenChange(false);

    // Find all non-coordinator members in groups
    const membersToUngroup = groupedDevices.filter((d) => !d.isCoordinator);

    if (membersToUngroup.length === 0) {
      toast.info('No grouped speakers to ungroup');
      return;
    }

    try {
      // Ungroup each member sequentially
      for (const device of membersToUngroup) {
        await leaveGroupMutation.mutateAsync(device.roomName);
      }
      toast.success(`Ungrouped ${membersToUngroup.length} speaker${membersToUngroup.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to ungroup devices:', error);
      toast.error(`Failed to ungroup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [onOpenChange, groupedDevices, leaveGroupMutation]);

  // Navigate to dashboard and enable selection mode
  const handleGroupSpeakers = useCallback(() => {
    closeAndRun(() => {
      router.push('/dashboard');
      // Note: Selection mode toggle is managed in device-grid.tsx
      // This just navigates to the dashboard where users can use the Select button
      toast.info('Use the "Select" button in the toolbar to select speakers to group');
    });
  }, [closeAndRun, router]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={handlePauseAll}>
            <Pause className="mr-2 h-4 w-4" />
            <span>Pause All</span>
            <CommandShortcut>⌘⇧P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleResumeAll}>
            <Play className="mr-2 h-4 w-4" />
            <span>Resume All</span>
            <CommandShortcut>⌘⇧R</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Grouping Actions */}
        <CommandGroup heading="Grouping">
          <CommandItem onSelect={handleGroupSpeakers}>
            <Users className="mr-2 h-4 w-4" />
            <span>Group speakers...</span>
          </CommandItem>
          {hasGroups && (
            <CommandItem onSelect={handleUngroupAll}>
              <Unlink className="mr-2 h-4 w-4" />
              <span>Ungroup all speakers</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Volume Presets */}
        <CommandGroup heading="Volume Presets">
          <CommandItem onSelect={() => handleSetAllVolume(0)}>
            <VolumeX className="mr-2 h-4 w-4" />
            <span>Mute All</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSetAllVolume(25)}>
            <Volume2 className="mr-2 h-4 w-4" />
            <span>Set All to 25%</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSetAllVolume(50)}>
            <Volume2 className="mr-2 h-4 w-4" />
            <span>Set All to 50%</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSetAllVolume(75)}>
            <Volume2 className="mr-2 h-4 w-4" />
            <span>Set All to 75%</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Playing Devices - Quick Pause */}
        {playingDevices.length > 0 && (
          <>
            <CommandGroup heading="Now Playing">
              {playingDevices.map((device) => (
                <CommandItem
                  key={device.id}
                  onSelect={() => handlePlayPause(device.roomName)}
                >
                  <Pause className="mr-2 h-4 w-4 text-success" />
                  <span>Pause {device.roomName}</span>
                  {device.nowPlaying?.title && (
                    <span className="ml-2 text-xs text-muted-foreground truncate max-w-[200px]">
                      {device.nowPlaying.title}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Paused Devices - Quick Resume */}
        {pausedDevices.length > 0 && (
          <>
            <CommandGroup heading="Paused">
              {pausedDevices.map((device) => (
                <CommandItem
                  key={device.id}
                  onSelect={() => handlePlayPause(device.roomName)}
                >
                  <Play className="mr-2 h-4 w-4 text-warning" />
                  <span>Resume {device.roomName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* All Devices */}
        <CommandGroup heading="Devices">
          {devices.map((device) => (
            <CommandItem
              key={device.id}
              onSelect={() => handlePlayPause(device.roomName)}
            >
              <Speaker className="mr-2 h-4 w-4" />
              <span>{device.roomName}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {device.playbackState === 'PLAYING'
                  ? 'Playing'
                  : device.playbackState === 'PAUSED_PLAYBACK'
                  ? 'Paused'
                  : 'Stopped'}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/dashboard/diagnostics')}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Diagnostics</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/dashboard/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

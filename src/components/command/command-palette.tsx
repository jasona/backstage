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
  usePauseAll,
  useResumeAll,
  usePlayPause,
  useSetAllVolume,
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
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { devices } = useDevices();
  const pauseAllMutation = usePauseAll();
  const resumeAllMutation = useResumeAll();
  const playPauseMutation = usePlayPause();
  const setAllVolumeMutation = useSetAllVolume();

  // Get playing devices
  const playingDevices = useMemo(
    () => devices.filter((d) => d.playbackState === 'PLAYING'),
    [devices]
  );

  const pausedDevices = useMemo(
    () => devices.filter((d) => d.playbackState === 'PAUSED_PLAYBACK'),
    [devices]
  );

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

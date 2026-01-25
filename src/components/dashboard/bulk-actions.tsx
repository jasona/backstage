'use client';

/**
 * Bulk actions component for dashboard header.
 * Provides Pause All, Resume All, and Set All Volume actions with confirmations.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  usePauseAll,
  useResumeAll,
  useSetAllVolume,
  useDevices,
} from '@/hooks/use-sonos';
import { toast } from 'sonner';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  ChevronDown,
  Loader2,
} from 'lucide-react';

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  action: () => void;
}

export function BulkActions() {
  const { devices } = useDevices();
  const pauseAllMutation = usePauseAll();
  const resumeAllMutation = useResumeAll();
  const setAllVolumeMutation = useSetAllVolume();

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    description: '',
    action: () => {},
  });

  const playingCount = devices.filter((d) => d.playbackState === 'PLAYING').length;

  // Close confirmation dialog
  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }, []);

  // Execute confirmed action
  const executeConfirmed = useCallback(() => {
    confirmDialog.action();
    closeConfirm();
  }, [confirmDialog, closeConfirm]);

  // Pause All with toast
  const handlePauseAll = useCallback(() => {
    pauseAllMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Paused all devices', {
          description: `${playingCount} devices paused`,
        });
      },
      onError: (error) => {
        toast.error('Failed to pause devices', {
          description: error.message,
        });
      },
    });
  }, [pauseAllMutation, playingCount]);

  // Resume All with toast
  const handleResumeAll = useCallback(() => {
    resumeAllMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Resumed all devices', {
          description: 'Playback resumed',
        });
      },
      onError: (error) => {
        toast.error('Failed to resume devices', {
          description: error.message,
        });
      },
    });
  }, [resumeAllMutation]);

  // Set All Volume with confirmation for destructive actions
  const handleSetAllVolume = useCallback(
    (volume: number) => {
      const volumeAction = () => {
        setAllVolumeMutation.mutate(volume, {
          onSuccess: () => {
            toast.success(`Set all devices to ${volume}%`, {
              description: `${devices.length} devices updated`,
            });
          },
          onError: (error) => {
            toast.error('Failed to set volume', {
              description: error.message,
            });
          },
        });
      };

      // Show confirmation for mute (0%) or very low volume (25%)
      if (volume <= 25) {
        setConfirmDialog({
          open: true,
          title: volume === 0 ? 'Mute All Devices?' : `Set All to ${volume}%?`,
          description:
            volume === 0
              ? `This will mute all ${devices.length} devices.`
              : `This will set all ${devices.length} devices to ${volume}% volume.`,
          action: volumeAction,
        });
      } else {
        volumeAction();
      }
    },
    [setAllVolumeMutation, devices.length]
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePauseAll}
        disabled={pauseAllMutation.isPending || playingCount === 0}
      >
        {pauseAllMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Pause className="w-4 h-4 mr-2" />
        )}
        Pause All
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleResumeAll}
        disabled={resumeAllMutation.isPending}
      >
        {resumeAllMutation.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        Resume All
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={setAllVolumeMutation.isPending}
          >
            {setAllVolumeMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4 mr-2" />
            )}
            Volume
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleSetAllVolume(0)}>
            <VolumeX className="w-4 h-4 mr-2" />
            Mute All
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleSetAllVolume(25)}>
            <Volume2 className="w-4 h-4 mr-2 opacity-40" />
            Set All to 25%
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSetAllVolume(50)}>
            <Volume2 className="w-4 h-4 mr-2 opacity-60" />
            Set All to 50%
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSetAllVolume(75)}>
            <Volume2 className="w-4 h-4 mr-2 opacity-80" />
            Set All to 75%
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSetAllVolume(100)}>
            <Volume2 className="w-4 h-4 mr-2" />
            Set All to 100%
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button onClick={executeConfirmed}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

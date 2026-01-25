'use client';

/**
 * Device information panel for diagnostics.
 * Shows detailed device properties like firmware, IP, MAC, etc.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Speaker,
  Wifi,
  HardDrive,
  Hash,
  Volume2,
  Play,
  Pause,
  Users,
  Crown,
  Copy,
  Check,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import type { DeviceStatus } from '@/types/sonos';

interface DeviceInfoProps {
  device?: DeviceStatus;
  isLoading: boolean;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  copyable?: boolean;
}

function InfoRow({ icon, label, value, copyable }: InfoRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (value) {
      navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    }
  }, [value]);

  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {value || '—'}
        </span>
        {copyable && value && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3 h-3 text-success" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export function DeviceInfo({ device, isLoading }: DeviceInfoProps) {
  const [rebootDialogOpen, setRebootDialogOpen] = useState(false);

  const handleReboot = useCallback(() => {
    // Note: Reboot is not supported through the current API
    toast.error('Reboot not supported', {
      description:
        'Device reboot requires direct access to the device. Please use the Sonos app.',
    });
    setRebootDialogOpen(false);
  }, []);

  if (isLoading || !device) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-surface border-border-subtle">
          <CardHeader>
            <Skeleton className="h-5 w-32 bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-32 bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-surface border-border-subtle">
          <CardHeader>
            <Skeleton className="h-5 w-32 bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-32 bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPlaying = device.playbackState === 'PLAYING';
  const isPaused = device.playbackState === 'PAUSED_PLAYBACK';

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Details */}
        <Card className="bg-surface border-border-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Speaker className="w-4 h-4" />
              Device Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              icon={<Speaker className="w-4 h-4" />}
              label="Room Name"
              value={device.roomName}
            />
            <InfoRow
              icon={<HardDrive className="w-4 h-4" />}
              label="Model"
              value={device.modelName}
            />
            <InfoRow
              icon={<Hash className="w-4 h-4" />}
              label="Device ID"
              value={device.id}
              copyable
            />
            <InfoRow
              icon={device.isCoordinator ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              label="Group Role"
              value={device.isCoordinator ? 'Coordinator' : 'Member'}
            />
            {device.groupId && (
              <InfoRow
                icon={<Users className="w-4 h-4" />}
                label="Group ID"
                value={device.groupId}
                copyable
              />
            )}
          </CardContent>
        </Card>

        {/* Playback Status */}
        <Card className="bg-surface border-border-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {isPlaying ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              Playback Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              icon={
                isPlaying ? (
                  <Play className="w-4 h-4 text-success" />
                ) : isPaused ? (
                  <Pause className="w-4 h-4 text-warning" />
                ) : (
                  <Pause className="w-4 h-4" />
                )
              }
              label="Status"
              value={
                isPlaying
                  ? 'Playing'
                  : isPaused
                  ? 'Paused'
                  : device.playbackState === 'TRANSITIONING'
                  ? 'Transitioning'
                  : 'Stopped'
              }
            />
            <InfoRow
              icon={<Volume2 className="w-4 h-4" />}
              label="Volume"
              value={`${device.volume}%`}
            />
            <InfoRow
              icon={<Volume2 className="w-4 h-4" />}
              label="Muted"
              value={device.muted ? 'Yes' : 'No'}
            />
            {device.nowPlaying?.title && (
              <>
                <InfoRow
                  icon={<Play className="w-4 h-4" />}
                  label="Track"
                  value={device.nowPlaying.title}
                />
                <InfoRow
                  icon={<Users className="w-4 h-4" />}
                  label="Artist"
                  value={device.nowPlaying.artist}
                />
                {device.nowPlaying.album && (
                  <InfoRow
                    icon={<HardDrive className="w-4 h-4" />}
                    label="Album"
                    value={device.nowPlaying.album}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-surface border-border-subtle md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              Device Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setRebootDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reboot Device
              </Button>
              <p className="text-xs text-muted-foreground flex items-center gap-1 w-full mt-2">
                <AlertCircle className="w-3 h-3" />
                Note: Some actions require direct device access and may not be available
                through this interface.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reboot Confirmation Dialog */}
      <Dialog open={rebootDialogOpen} onOpenChange={setRebootDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reboot {device.roomName}?</DialogTitle>
            <DialogDescription>
              This will restart the device. It may take a few minutes for the device
              to come back online.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRebootDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReboot}>
              Reboot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

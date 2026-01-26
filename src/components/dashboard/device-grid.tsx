'use client';

/**
 * Device grid/list container component.
 * Displays all devices with sorting and filtering.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { DeviceCard } from './device-card';
import { GroupManager } from './group-manager';
import { GroupSelectionBar } from './group-selection-bar';
import { MusicPicker } from './music-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useDevices,
  useZoneStatuses,
  usePlayPause,
  useNext,
  usePrevious,
  useVolume,
  useToggleMute,
  useJoinGroup,
} from '@/hooks/use-sonos';
import {
  Search,
  SortAsc,
  Filter,
  RefreshCw,
  Speaker,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';
import type { DeviceStatus, PlaybackState } from '@/types/sonos';

type SortField = 'roomName' | 'status' | 'model';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | PlaybackState;

interface DeviceGridProps {
  className?: string;
}

export function DeviceGrid({ className }: DeviceGridProps) {
  const { devices, isLoading, isError, error, refetch } = useDevices();
  const { zoneStatuses } = useZoneStatuses();
  const playPauseMutation = usePlayPause();
  const nextMutation = useNext();
  const previousMutation = usePrevious();
  const volumeMutation = useVolume();
  const toggleMuteMutation = useToggleMute();
  const joinGroupMutation = useJoinGroup();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-sort-field');
      if (saved === 'roomName' || saved === 'status' || saved === 'model') {
        return saved;
      }
    }
    return 'roomName';
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-sort-direction');
      if (saved === 'asc' || saved === 'desc') {
        return saved;
      }
    }
    return 'asc';
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Persist sort preferences to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-sort-field', sortField);
  }, [sortField]);

  useEffect(() => {
    localStorage.setItem('dashboard-sort-direction', sortDirection);
  }, [sortDirection]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [groupManageDevice, setGroupManageDevice] = useState<DeviceStatus | null>(null);
  const [musicPickerRoom, setMusicPickerRoom] = useState<string | null>(null);

  // Multi-select state for batch grouping
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [isGroupingInProgress, setIsGroupingInProgress] = useState(false);

  // Find zone for a device
  const getZoneForDevice = useCallback(
    (device: DeviceStatus) => {
      return zoneStatuses.find(
        (z) => z.coordinatorId === device.id || z.memberIds.includes(device.id)
      );
    },
    [zoneStatuses]
  );

  // Handle group manage click
  const handleGroupManage = useCallback((device: DeviceStatus) => {
    setGroupManageDevice(device);
  }, []);

  // Handle music picker open
  const handlePickMusic = useCallback((roomName: string) => {
    setMusicPickerRoom(roomName);
  }, []);

  // Get ungrouped devices for selection mode
  const ungroupedDevices = useMemo(() => {
    return devices.filter((d) => {
      const zone = zoneStatuses.find(
        (z) => z.coordinatorId === d.id || z.memberIds.includes(d.id)
      );
      return zone && zone.memberIds.length <= 1;
    });
  }, [devices, zoneStatuses]);

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        // Clear selection when exiting selection mode
        setSelectedDeviceIds(new Set());
      }
      return !prev;
    });
  }, []);

  // Toggle device selection
  const toggleDeviceSelection = useCallback((deviceId: string) => {
    setSelectedDeviceIds((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }
      return next;
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedDeviceIds(new Set());
    setIsSelectionMode(false);
  }, []);

  // Group selected devices together
  const groupSelectedDevices = useCallback(async () => {
    const selectedDevices = devices.filter((d) => selectedDeviceIds.has(d.id));
    if (selectedDevices.length < 2) return;

    setIsGroupingInProgress(true);

    try {
      // Use the first selected device as the coordinator
      const [coordinator, ...members] = selectedDevices;

      // Join each member to the coordinator's group sequentially
      for (const member of members) {
        await joinGroupMutation.mutateAsync({
          roomName: member.roomName,
          targetRoom: coordinator.roomName,
        });
      }

      toast.success(`Created group with ${selectedDevices.length} speakers`);
      clearSelection();
    } catch (error) {
      console.error('Failed to group devices:', error);
      toast.error(`Failed to group speakers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGroupingInProgress(false);
    }
  }, [devices, selectedDeviceIds, joinGroupMutation, clearSelection]);

  // Filter and sort devices
  const filteredDevices = useMemo(() => {
    let result = [...devices];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.roomName.toLowerCase().includes(query) ||
          d.modelName.toLowerCase().includes(query) ||
          d.nowPlaying?.title?.toLowerCase().includes(query) ||
          d.nowPlaying?.artist?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.playbackState === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'roomName':
          comparison = a.roomName.localeCompare(b.roomName);
          break;
        case 'status':
          // Playing first, then paused, then stopped
          const statusOrder: Record<PlaybackState, number> = {
            PLAYING: 0,
            PAUSED_PLAYBACK: 1,
            TRANSITIONING: 2,
            STOPPED: 3,
          };
          comparison = statusOrder[a.playbackState] - statusOrder[b.playbackState];
          break;
        case 'model':
          comparison = a.modelName.localeCompare(b.modelName);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [devices, searchQuery, statusFilter, sortField, sortDirection]);

  // Handlers
  const handleSortChange = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

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

  const handleVolumeChange = useCallback(
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

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-surface border-border-subtle">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-24 bg-muted" />
                  <Skeleton className="h-3 w-16 bg-muted" />
                </div>
                <Skeleton className="h-2 w-2 rounded-full bg-muted" />
              </div>
              <Skeleton className="h-4 w-full bg-muted" />
              <div className="flex justify-center gap-2">
                <Skeleton className="h-8 w-8 rounded bg-muted" />
                <Skeleton className="h-10 w-10 rounded bg-muted" />
                <Skeleton className="h-8 w-8 rounded bg-muted" />
              </div>
              <Skeleton className="h-4 w-full bg-muted" />
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
          {error?.message || 'Could not connect to the Sonos backend. Make sure node-sonos-http-api is running.'}
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

  // Count by status
  const playingCount = devices.filter((d) => d.playbackState === 'PLAYING').length;
  const pausedCount = devices.filter((d) => d.playbackState === 'PAUSED_PLAYBACK').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <Badge
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('all')}
          >
            All ({devices.length})
          </Badge>
          <Badge
            variant={statusFilter === 'PLAYING' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('PLAYING')}
          >
            Playing ({playingCount})
          </Badge>
          <Badge
            variant={statusFilter === 'PAUSED_PLAYBACK' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('PAUSED_PLAYBACK')}
          >
            Paused ({pausedCount})
          </Badge>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Button
            variant={sortField === 'roomName' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleSortChange('roomName')}
            className="h-7 text-xs"
          >
            Name
            {sortField === 'roomName' && (
              <SortAsc
                className={cn('w-3 h-3 ml-1', sortDirection === 'desc' && 'rotate-180')}
              />
            )}
          </Button>
          <Button
            variant={sortField === 'status' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleSortChange('status')}
            className="h-7 text-xs"
          >
            Status
            {sortField === 'status' && (
              <SortAsc
                className={cn('w-3 h-3 ml-1', sortDirection === 'desc' && 'rotate-180')}
              />
            )}
          </Button>
        </div>

        {/* Selection Mode Toggle */}
        {ungroupedDevices.length >= 2 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelectionMode ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="h-8"
                >
                  {isSelectionMode ? (
                    <CheckSquare className="w-4 h-4 mr-1" />
                  ) : (
                    <Square className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-xs">Select</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select multiple speakers to group together</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Refresh */}
        <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* No results */}
      {filteredDevices.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No devices match your search
        </div>
      )}

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDevices.map((device) => {
          const zone = getZoneForDevice(device);
          const isUngrouped = zone && zone.memberIds.length <= 1;
          const isSelectedForGrouping = selectedDeviceIds.has(device.id);

          return (
            <div
              key={device.id}
              className={cn(
                'relative',
                isSelectionMode && isUngrouped && 'cursor-pointer'
              )}
              onClick={
                isSelectionMode && isUngrouped
                  ? () => toggleDeviceSelection(device.id)
                  : undefined
              }
            >
              {/* Selection indicator overlay */}
              {isSelectionMode && isUngrouped && (
                <div
                  className={cn(
                    'absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center',
                    isSelectedForGrouping
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted border border-border-subtle'
                  )}
                >
                  {isSelectedForGrouping ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Dimmed overlay for grouped devices in selection mode */}
              {isSelectionMode && !isUngrouped && (
                <div className="absolute inset-0 bg-background/50 z-10 rounded-lg pointer-events-none" />
              )}

              <DeviceCard
                device={device}
                zone={zone}
                isSelected={
                  isSelectionMode
                    ? isSelectedForGrouping
                    : selectedDeviceId === device.id
                }
                isPlayPauseLoading={
                  playPauseMutation.isPending &&
                  playPauseMutation.variables === device.roomName
                }
                isNextLoading={
                  nextMutation.isPending &&
                  nextMutation.variables === device.roomName
                }
                isPreviousLoading={
                  previousMutation.isPending &&
                  previousMutation.variables === device.roomName
                }
                onSelect={isSelectionMode ? undefined : setSelectedDeviceId}
                onPlayPause={isSelectionMode ? undefined : handlePlayPause}
                onNext={isSelectionMode ? undefined : handleNext}
                onPrevious={isSelectionMode ? undefined : handlePrevious}
                onVolumeChange={isSelectionMode ? undefined : handleVolumeChange}
                onToggleMute={isSelectionMode ? undefined : handleToggleMute}
                onGroupManage={isSelectionMode ? undefined : handleGroupManage}
                onPickMusic={isSelectionMode ? undefined : handlePickMusic}
              />
            </div>
          );
        })}
      </div>

      {/* Group Selection Bar */}
      <GroupSelectionBar
        selectedCount={selectedDeviceIds.size}
        isLoading={isGroupingInProgress}
        onGroupTogether={groupSelectedDevices}
        onClearSelection={clearSelection}
      />

      {/* Group Manager Dialog */}
      {groupManageDevice && (
        <GroupManager
          device={groupManageDevice}
          open={!!groupManageDevice}
          onOpenChange={(open) => !open && setGroupManageDevice(null)}
        />
      )}

      {/* Music Picker Dialog */}
      {musicPickerRoom && (
        <MusicPicker
          roomName={musicPickerRoom}
          open={!!musicPickerRoom}
          onOpenChange={(open) => !open && setMusicPickerRoom(null)}
        />
      )}
    </div>
  );
}

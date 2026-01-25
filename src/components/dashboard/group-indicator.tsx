'use client';

/**
 * Group indicator component showing group membership.
 * Displays the group name and member count for grouped devices.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Users, Crown } from 'lucide-react';

interface GroupIndicatorProps {
  /** Name of the group (coordinator's room name) */
  groupName: string;
  /** Number of members in the group */
  memberCount: number;
  /** Whether this device is the coordinator */
  isCoordinator: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function GroupIndicator({
  groupName,
  memberCount,
  isCoordinator,
  className,
}: GroupIndicatorProps) {
  // Don't show indicator for single devices (not in a group)
  if (memberCount <= 1) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs px-1.5 py-0 gap-1 transition-colors',
        isCoordinator
          ? 'border-primary/50 text-primary'
          : 'border-border-subtle text-muted-foreground',
        className
      )}
    >
      {isCoordinator ? (
        <Crown className="w-3 h-3" />
      ) : (
        <Users className="w-3 h-3" />
      )}
      <span className="truncate max-w-[80px]">
        {isCoordinator ? 'Leading' : groupName}
      </span>
      <span className="text-muted-foreground">+{memberCount - 1}</span>
    </Badge>
  );
}

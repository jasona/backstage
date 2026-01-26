'use client';

/**
 * Floating action bar for batch grouping operations.
 * Shows when multiple devices are selected.
 */

import { Button } from '@/components/ui/button';
import { Users, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupSelectionBarProps {
  /** Number of selected devices */
  selectedCount: number;
  /** Whether a grouping operation is in progress */
  isLoading?: boolean;
  /** Callback to group selected devices together */
  onGroupTogether: () => void;
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Additional className */
  className?: string;
}

export function GroupSelectionBar({
  selectedCount,
  isLoading = false,
  onGroupTogether,
  onClearSelection,
  className,
}: GroupSelectionBarProps) {
  if (selectedCount < 2) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'bg-surface border border-border-subtle rounded-lg shadow-lg',
        'px-4 py-3 flex items-center gap-4',
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-foreground">
          {selectedCount} speakers selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onGroupTogether}
          disabled={isLoading}
          className="h-8"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Users className="w-4 h-4 mr-2" />
          )}
          Group Together
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isLoading}
          className="h-8 px-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

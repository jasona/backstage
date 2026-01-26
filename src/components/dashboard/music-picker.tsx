'use client';

/**
 * Music picker dialog for selecting and playing Sonos favorites.
 * Opens when play is clicked on a stopped device with no queue.
 */

import { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useFavorites, usePlayFavorite } from '@/hooks/use-favorites';
import {
  Play,
  AlertCircle,
  Loader2,
  Heart,
} from 'lucide-react';
import type { Favorite } from '@/lib/favorites-api';

interface MusicPickerProps {
  /** Room name to play music on */
  roomName: string;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Individual favorite item row
 */
function FavoriteItem({
  favorite,
  isPlaying,
  onPlay,
}: {
  favorite: Favorite;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      disabled={isPlaying}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors group',
        'hover:bg-hover focus:bg-hover focus:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
        <Heart className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Title */}
      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {favorite.title}
      </span>

      {/* Play indicator */}
      {isPlaying ? (
        <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
      ) : (
        <Play className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
      )}
    </button>
  );
}

/**
 * Loading skeleton for favorites list
 */
function FavoritesLoading() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-10 h-10 rounded bg-muted" />
          <Skeleton className="h-4 flex-1 bg-muted" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no favorites exist
 */
function FavoritesEmpty() {
  return (
    <div className="py-8 text-center">
      <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">
        No favorites saved yet.
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Add favorites in your Sonos app to see them here.
      </p>
    </div>
  );
}

/**
 * Error state when favorites fail to load
 */
function FavoritesError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
      <p className="text-sm text-foreground mb-2">Failed to load favorites</p>
      <p className="text-xs text-muted-foreground mb-4">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function MusicPicker({ roomName, open, onOpenChange }: MusicPickerProps) {
  const {
    data: favorites,
    isLoading,
    isError,
    error,
    refetch,
  } = useFavorites(open ? roomName : null);

  const playFavoriteMutation = usePlayFavorite();

  const handlePlayFavorite = useCallback(
    async (favoriteName: string) => {
      try {
        await playFavoriteMutation.mutateAsync({
          roomName,
          favoriteName,
        });
        // Close dialog after successful play
        onOpenChange(false);
      } catch (err) {
        console.error('Failed to play favorite:', err);
      }
    },
    [roomName, playFavoriteMutation, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Play Music on {roomName}</DialogTitle>
          <DialogDescription>
            Choose from your Sonos favorites to start playing.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
          {isLoading && <FavoritesLoading />}

          {isError && (
            <FavoritesError
              message={error?.message || 'Unknown error'}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && favorites && favorites.length === 0 && (
            <FavoritesEmpty />
          )}

          {!isLoading && !isError && favorites && favorites.length > 0 && (
            <div className="space-y-1">
              {favorites.map((favorite, index) => (
                <FavoriteItem
                  key={`${favorite.title}-${index}`}
                  favorite={favorite}
                  isPlaying={
                    playFavoriteMutation.isPending &&
                    playFavoriteMutation.variables?.favoriteName === favorite.title
                  }
                  onPlay={() => handlePlayFavorite(favorite.title)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

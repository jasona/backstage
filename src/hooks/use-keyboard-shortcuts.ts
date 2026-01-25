'use client';

/**
 * Global keyboard shortcuts hook.
 * Provides app-wide keyboard shortcuts for common actions.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePauseAll, useResumeAll, useVolume, useDevices } from './use-sonos';

interface UseKeyboardShortcutsOptions {
  /** Callback when command palette should open */
  onOpenCommandPalette?: () => void;
  /** Currently selected device ID for per-device shortcuts */
  selectedDeviceId?: string | null;
  /** Callback to clear selection */
  onClearSelection?: () => void;
}

export function useKeyboardShortcuts({
  onOpenCommandPalette,
  selectedDeviceId,
  onClearSelection,
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();
  const { devices } = useDevices();
  const pauseAllMutation = usePauseAll();
  const resumeAllMutation = useResumeAll();
  const volumeMutation = useVolume();

  // Track if we're in an input field
  const isInInputRef = useRef(false);

  // Get selected device
  const selectedDevice = selectedDeviceId
    ? devices.find((d) => d.id === selectedDeviceId)
    : null;

  // Check if event target is an input
  const isInputTarget = useCallback((target: EventTarget | null) => {
    if (!target) return false;
    const element = target as HTMLElement;
    const tagName = element.tagName?.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.isContentEditable
    );
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input field (except for escape)
      if (isInputTarget(e.target) && e.key !== 'Escape') {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Cmd/Ctrl + K: Open command palette
      if (isMod && e.key === 'k') {
        e.preventDefault();
        onOpenCommandPalette?.();
        return;
      }

      // Escape: Close modals, clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        onClearSelection?.();
        return;
      }

      // Cmd/Ctrl + ,: Open settings
      if (isMod && e.key === ',') {
        e.preventDefault();
        router.push('/dashboard/settings');
        return;
      }

      // Cmd/Ctrl + Shift + P: Pause all
      if (isMod && isShift && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        pauseAllMutation.mutate();
        return;
      }

      // Cmd/Ctrl + Shift + R: Resume all
      if (isMod && isShift && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        resumeAllMutation.mutate();
        return;
      }

      // /: Focus search/filter (not implemented yet, placeholder)
      if (e.key === '/' && !isMod) {
        e.preventDefault();
        // Focus search input if available
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="search" i], input[placeholder*="filter" i]'
        );
        searchInput?.focus();
        return;
      }

      // Space: Toggle play/pause on selected device
      if (e.key === ' ' && selectedDevice && !isMod) {
        e.preventDefault();
        // This would call playPause mutation - hook it up through props
        return;
      }

      // Arrow Up: Volume up on selected device
      if (e.key === 'ArrowUp' && selectedDevice && !isMod) {
        e.preventDefault();
        const newVolume = Math.min(100, selectedDevice.volume + 5);
        volumeMutation.mutate({
          roomName: selectedDevice.roomName,
          volume: newVolume,
        });
        return;
      }

      // Arrow Down: Volume down on selected device
      if (e.key === 'ArrowDown' && selectedDevice && !isMod) {
        e.preventDefault();
        const newVolume = Math.max(0, selectedDevice.volume - 5);
        volumeMutation.mutate({
          roomName: selectedDevice.roomName,
          volume: newVolume,
        });
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isInputTarget,
    onOpenCommandPalette,
    onClearSelection,
    router,
    pauseAllMutation,
    resumeAllMutation,
    volumeMutation,
    selectedDevice,
  ]);

  return {
    selectedDevice,
  };
}

/**
 * Get the correct modifier key symbol for the current OS
 */
export function getModifierKey(): '⌘' | 'Ctrl' {
  if (typeof window === 'undefined') return '⌘';
  return navigator.platform?.toLowerCase().includes('mac') ? '⌘' : 'Ctrl';
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(
  key: string,
  options?: { mod?: boolean; shift?: boolean; alt?: boolean }
): string {
  const parts: string[] = [];
  const modKey = getModifierKey();

  if (options?.mod) parts.push(modKey);
  if (options?.shift) parts.push('⇧');
  if (options?.alt) parts.push('⌥');
  parts.push(key.toUpperCase());

  return parts.join('');
}

/**
 * Keyboard shortcuts reference
 */
export const KEYBOARD_SHORTCUTS = {
  commandPalette: { key: 'K', mod: true, description: 'Open command palette' },
  settings: { key: ',', mod: true, description: 'Open settings' },
  pauseAll: { key: 'P', mod: true, shift: true, description: 'Pause all' },
  resumeAll: { key: 'R', mod: true, shift: true, description: 'Resume all' },
  escape: { key: 'Esc', description: 'Close/deselect' },
  search: { key: '/', description: 'Focus search' },
  volumeUp: { key: '↑', description: 'Volume up (selected)' },
  volumeDown: { key: '↓', description: 'Volume down (selected)' },
  playPause: { key: 'Space', description: 'Play/pause (selected)' },
} as const;

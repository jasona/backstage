'use client';

/**
 * Dashboard layout with sidebar navigation.
 */

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/providers/auth-provider';
import { SonosProvider } from '@/providers/sonos-provider';
import { CommandPalette } from '@/components/command/command-palette';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isLoading, isConfigured, isAuthenticated, hasPinProtection } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Open command palette callback
  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  // Clear selection callback
  const handleClearSelection = useCallback(() => {
    setSelectedDeviceId(null);
  }, []);

  // Use keyboard shortcuts hook
  useKeyboardShortcuts({
    onOpenCommandPalette: handleOpenCommandPalette,
    selectedDeviceId,
    onClearSelection: handleClearSelection,
  });

  // Protect dashboard routes
  useEffect(() => {
    if (isLoading) return;

    if (!isConfigured) {
      router.replace('/setup');
    } else if (hasPinProtection && !isAuthenticated) {
      router.replace('/unlock');
    }
  }, [isLoading, isConfigured, isAuthenticated, hasPinProtection, router]);

  // Show loading while checking auth
  if (isLoading || !isConfigured || (hasPinProtection && !isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <SonosProvider>
      <div className="flex min-h-screen bg-base">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </div>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </SonosProvider>
  );
}

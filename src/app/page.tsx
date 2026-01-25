'use client';

/**
 * Home page - handles routing based on configuration and auth state.
 * Redirects to setup, unlock, or dashboard as appropriate.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isLoading, isConfigured, isAuthenticated, hasPinProtection } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isConfigured) {
      // Not configured - go to setup wizard
      router.replace('/setup');
    } else if (hasPinProtection && !isAuthenticated) {
      // Has PIN but not authenticated - go to unlock
      router.replace('/unlock');
    } else {
      // Configured and authenticated (or no PIN) - go to dashboard
      router.replace('/dashboard');
    }
  }, [isLoading, isConfigured, isAuthenticated, hasPinProtection, router]);

  // Show loading while determining where to redirect
  return (
    <main className="min-h-screen flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}

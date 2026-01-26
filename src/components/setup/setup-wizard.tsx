'use client';

/**
 * First-run setup wizard component.
 * Guides users through initial configuration.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PinSetup } from './pin-setup';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Wifi, Lock, ArrowRight, RefreshCw } from 'lucide-react';

type SetupStep = 'welcome' | 'connecting' | 'connected' | 'connection-failed' | 'pin-setup' | 'complete';

interface SetupState {
  step: SetupStep;
  deviceCount?: number;
  error?: string;
}

const INITIAL_STATE: SetupState = {
  step: 'welcome',
};

export function SetupWizard() {
  const router = useRouter();
  const auth = useAuth();
  const [state, setState] = useState<SetupState>(INITIAL_STATE);

  const updateState = useCallback((updates: Partial<SetupState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Check connection to Sonos API
  const checkConnection = useCallback(async () => {
    updateState({ step: 'connecting', error: undefined });

    try {
      const response = await fetch('/api/sonos/health');
      const data = await response.json();

      if (data.connected) {
        updateState({
          step: 'connected',
          deviceCount: data.deviceCount
        });
        // Auto-advance to PIN setup after brief delay
        setTimeout(() => {
          updateState({ step: 'pin-setup' });
        }, 1500);
      } else {
        updateState({
          step: 'connection-failed',
          error: data.error || 'Could not connect to Sonos API',
        });
      }
    } catch (err) {
      updateState({
        step: 'connection-failed',
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  }, [updateState]);

  // Handle PIN setup completion - save to server
  const handlePinSetup = useCallback(async (pin: string | null) => {
    try {
      // Call server API to setup PIN
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const result = await response.json();

      if (!response.ok) {
        updateState({
          error: result.error || 'Failed to save configuration',
        });
        return;
      }

      updateState({ step: 'complete' });

      // Refresh auth state and redirect to dashboard after brief delay
      await auth.refresh();
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'Failed to save configuration',
      });
    }
  }, [updateState, router, auth]);

  // Render step content
  const renderStep = () => {
    switch (state.step) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wifi className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to Backstage</CardTitle>
              <CardDescription className="text-base">
                A modern dashboard for managing your Sonos devices.
                Let&apos;s get you set up.
              </CardDescription>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Before we begin, make sure:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>node-sonos-http-api is running on this server</li>
                <li>Your Sonos devices are powered on</li>
              </ul>
            </div>

            <Button
              onClick={checkConnection}
              className="w-full"
              size="lg"
            >
              Connect to Sonos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'connecting':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <CardTitle>Connecting...</CardTitle>
              <CardDescription>
                Looking for your Sonos system
              </CardDescription>
            </div>
          </div>
        );

      case 'connected':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div className="space-y-2">
              <CardTitle>Connected!</CardTitle>
              <CardDescription>
                Found {state.deviceCount || 'your'} Sonos device{state.deviceCount !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        );

      case 'connection-failed':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>Connection Failed</CardTitle>
              <CardDescription>
                {state.error || 'Could not connect to Sonos API'}
              </CardDescription>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
              <p className="font-medium text-foreground">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Make sure node-sonos-http-api is running</li>
                <li>Check that it&apos;s accessible at localhost:5005</li>
                <li>Verify your Sonos devices are on the same network</li>
              </ul>
            </div>

            <Button
              onClick={checkConnection}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        );

      case 'pin-setup':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Secure Your Dashboard</CardTitle>
              <CardDescription>
                Optionally protect your dashboard with a PIN.
                You can always change this later in settings.
              </CardDescription>
            </div>

            <PinSetup onComplete={handlePinSetup} />

            {state.error && (
              <p className="text-sm text-destructive text-center">{state.error}</p>
            )}
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div className="space-y-2">
              <CardTitle>You&apos;re All Set!</CardTitle>
              <CardDescription>
                Redirecting to your dashboard...
              </CardDescription>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepIndex = () => {
    const progressSteps = ['welcome', 'pin-setup', 'complete'];
    const currentStep = state.step;

    if (currentStep === 'connecting' || currentStep === 'connected') return 0.5;
    if (currentStep === 'connection-failed') return 0;
    return progressSteps.indexOf(currentStep as 'welcome' | 'pin-setup' | 'complete');
  };

  return (
    <Card className="w-full max-w-md bg-surface border-border-subtle">
      <CardHeader className="pb-4">
        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {['connect', 'secure', 'done'].map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                index <= getStepIndex()
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>{renderStep()}</CardContent>
    </Card>
  );
}

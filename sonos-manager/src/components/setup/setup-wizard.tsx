'use client';

/**
 * First-run setup wizard component.
 * Guides users through initial configuration.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PinSetup } from './pin-setup';
import { setConfig } from '@/lib/storage';
import { hashPin } from '@/lib/pin';
import { checkConnection } from '@/lib/sonos-api';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Wifi, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import type { SetupState } from '@/types/config';

const INITIAL_STATE: SetupState = {
  step: 'welcome',
  seedIp: '',
  pinEnabled: false,
};

export function SetupWizard() {
  const router = useRouter();
  const [state, setState] = useState<SetupState>(INITIAL_STATE);
  const [isValidating, setIsValidating] = useState(false);

  const updateState = useCallback((updates: Partial<SetupState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Validate IP address format
  const isValidIp = (ip: string): boolean => {
    const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!pattern.test(ip)) return false;
    const parts = ip.split('.').map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  };

  // Handle IP validation and device discovery
  const handleValidateIp = async () => {
    if (!isValidIp(state.seedIp)) {
      updateState({ error: 'Please enter a valid IP address' });
      return;
    }

    setIsValidating(true);
    updateState({ step: 'validating', error: undefined });

    try {
      // For now, we'll just check if the backend is reachable
      // The backend will handle the actual Sonos discovery
      const isConnected = await checkConnection();

      if (isConnected) {
        updateState({ step: 'discovery', deviceCount: undefined });
        // Simulate discovery delay
        setTimeout(() => {
          updateState({ step: 'pin-setup' });
        }, 1500);
      } else {
        updateState({
          step: 'ip-entry',
          error: 'Could not connect to Sonos backend. Make sure node-sonos-http-api is running.',
        });
      }
    } catch (err) {
      updateState({
        step: 'ip-entry',
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle PIN setup completion
  const handlePinSetup = async (pin: string | null) => {
    try {
      const pinHash = pin ? await hashPin(pin) : undefined;

      // Save configuration
      setConfig({
        seedIp: state.seedIp,
        pinHash,
        isConfigured: true,
      });

      updateState({ step: 'complete' });

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'Failed to save configuration',
      });
    }
  };

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
              <CardTitle className="text-2xl">Welcome to Sonos Manager</CardTitle>
              <CardDescription className="text-base">
                A modern dashboard for managing your Sonos devices.
                Let&apos;s get you set up.
              </CardDescription>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Before we begin, make sure you have:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>node-sonos-http-api running on your network</li>
                <li>At least one Sonos device IP address</li>
              </ul>
            </div>

            <Button
              onClick={() => updateState({ step: 'ip-entry' })}
              className="w-full"
              size="lg"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'ip-entry':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <CardTitle>Enter Device IP</CardTitle>
              <CardDescription>
                Enter the IP address of any Sonos device on your network.
                We&apos;ll use it to discover all your devices.
              </CardDescription>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="192.168.1.100"
                  value={state.seedIp}
                  onChange={(e) => updateState({ seedIp: e.target.value, error: undefined })}
                  className={cn(
                    'text-center text-lg h-12',
                    state.error && 'border-destructive'
                  )}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidateIp()}
                />
                {state.error && (
                  <p className="text-sm text-destructive text-center">{state.error}</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                You can find device IPs in your router&apos;s admin panel or the Sonos app settings.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => updateState({ step: 'welcome' })}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleValidateIp}
                disabled={!state.seedIp || isValidating}
                className="flex-1"
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Connect
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'validating':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <CardTitle>Connecting...</CardTitle>
              <CardDescription>
                Validating connection to {state.seedIp}
              </CardDescription>
            </div>
          </div>
        );

      case 'discovery':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div className="space-y-2">
              <CardTitle>Connected!</CardTitle>
              <CardDescription>
                Successfully connected to your Sonos system.
                Discovering devices...
              </CardDescription>
            </div>
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

  return (
    <Card className="w-full max-w-md bg-surface border-border-subtle">
      <CardHeader className="pb-4">
        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {['welcome', 'ip-entry', 'pin-setup', 'complete'].map((step, index) => (
            <div
              key={step}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                index <= ['welcome', 'ip-entry', 'validating', 'discovery', 'pin-setup', 'complete'].indexOf(state.step)
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

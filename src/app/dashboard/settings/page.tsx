'use client';

/**
 * Settings page for managing Backstage preferences.
 * Includes PIN change functionality.
 */

import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { validatePin, MIN_PIN_LENGTH, MAX_PIN_LENGTH } from '@/lib/pin';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Shield, Lock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Settings"
        description="Manage your Backstage preferences"
      />
      <main className="flex-1 p-6 overflow-auto">
        <SecuritySection />
      </main>
    </div>
  );
}

function SecuritySection() {
  const { hasPinProtection, refresh } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Refresh auth state to get updated hasPinProtection
      refresh();
    }
  }, [refresh]);

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5" />
        Security
      </h2>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-4 h-4" />
            PIN Protection
          </CardTitle>
          <CardDescription>
            {hasPinProtection
              ? 'Your dashboard is protected with a PIN code.'
              : 'Your dashboard is not protected with a PIN.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            {hasPinProtection ? 'Change PIN' : 'Set PIN'}
          </Button>
        </CardContent>
      </Card>

      <ChangePinDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        hasPinProtection={hasPinProtection}
      />
    </section>
  );
}

type ChangePinStep = 'current' | 'new' | 'confirm' | 'success';

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasPinProtection: boolean;
}

function ChangePinDialog({ open, onOpenChange, hasPinProtection }: ChangePinDialogProps) {
  // Start at 'new' step if no PIN is set, otherwise start at 'current'
  const initialStep: ChangePinStep = hasPinProtection ? 'current' : 'new';
  const [step, setStep] = useState<ChangePinStep>(initialStep);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const resetState = useCallback(() => {
    setStep(hasPinProtection ? 'current' : 'new');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError(undefined);
    setIsLoading(false);
  }, [hasPinProtection]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  }, [onOpenChange, resetState]);

  const handlePinChange = useCallback((value: string, setter: (v: string) => void) => {
    const digits = value.replace(/\D/g, '').slice(0, MAX_PIN_LENGTH);
    setter(digits);
    setError(undefined);
  }, []);

  const handleVerifyCurrentPin = useCallback(async () => {
    if (currentPin.length < MIN_PIN_LENGTH) {
      setError(`PIN must be at least ${MIN_PIN_LENGTH} digits`);
      return;
    }
    setStep('new');
  }, [currentPin]);

  const handleSubmitNewPin = useCallback(() => {
    const validation = validatePin(newPin);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setStep('confirm');
  }, [newPin]);

  const handleConfirmPin = useCallback(async () => {
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      setConfirmPin('');
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const response = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setStep('current');
          setCurrentPin('');
          setError('Current PIN is incorrect');
        } else {
          setError(data.error || 'Failed to change PIN');
        }
        return;
      }

      setStep('success');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPin, newPin, confirmPin]);

  const handleBack = useCallback(() => {
    setError(undefined);
    if (step === 'new' && hasPinProtection) {
      setStep('current');
      setNewPin('');
    } else if (step === 'confirm') {
      setStep('new');
      setConfirmPin('');
    }
  }, [step, hasPinProtection]);

  const getStepTitle = () => {
    switch (step) {
      case 'current': return 'Enter Current PIN';
      case 'new': return hasPinProtection ? 'Enter New PIN' : 'Set a PIN';
      case 'confirm': return 'Confirm PIN';
      case 'success': return hasPinProtection ? 'PIN Changed' : 'PIN Set';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'current': return 'Verify your identity by entering your current PIN';
      case 'new': return `Enter a ${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} digit PIN`;
      case 'confirm': return 'Re-enter your PIN to confirm';
      case 'success': return hasPinProtection
        ? 'Your PIN has been successfully changed'
        : 'Your PIN has been set successfully';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>

        {step === 'success' ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              You can now use your new PIN to unlock the dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {step === 'current' && (
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="••••"
                value={currentPin}
                onChange={(e) => handlePinChange(e.target.value, setCurrentPin)}
                className={cn(
                  'text-center text-2xl tracking-[0.5em] h-14',
                  error && 'border-destructive'
                )}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCurrentPin()}
              />
            )}

            {step === 'new' && (
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="••••"
                value={newPin}
                onChange={(e) => handlePinChange(e.target.value, setNewPin)}
                className={cn(
                  'text-center text-2xl tracking-[0.5em] h-14',
                  error && 'border-destructive'
                )}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitNewPin()}
              />
            )}

            {step === 'confirm' && (
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => handlePinChange(e.target.value, setConfirmPin)}
                className={cn(
                  'text-center text-2xl tracking-[0.5em] h-14',
                  error && 'border-destructive'
                )}
                autoFocus
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmPin()}
              />
            )}

            {error && (
              <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                <XCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'success' ? (
            <Button onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
              Done
            </Button>
          ) : (
            <div className="flex gap-3 w-full sm:w-auto">
              {(step === 'confirm' || (step === 'new' && hasPinProtection)) && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  Back
                </Button>
              )}
              {step === 'current' && (
                <Button
                  onClick={handleVerifyCurrentPin}
                  disabled={currentPin.length < MIN_PIN_LENGTH}
                  className="flex-1 sm:flex-none"
                >
                  Continue
                </Button>
              )}
              {step === 'new' && (
                <Button
                  onClick={handleSubmitNewPin}
                  disabled={newPin.length < MIN_PIN_LENGTH}
                  className="flex-1 sm:flex-none"
                >
                  Continue
                </Button>
              )}
              {step === 'confirm' && (
                <Button
                  onClick={handleConfirmPin}
                  disabled={confirmPin.length < MIN_PIN_LENGTH || isLoading}
                  className="flex-1 sm:flex-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Change PIN'
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

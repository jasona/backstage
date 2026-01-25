'use client';

/**
 * PIN setup component for the setup wizard.
 * Allows users to optionally set a PIN for dashboard protection.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validatePin, MIN_PIN_LENGTH, MAX_PIN_LENGTH } from '@/lib/pin';
import { cn } from '@/lib/utils';

interface PinSetupProps {
  /** Called when PIN setup is complete (pin is null if skipped) */
  onComplete: (pin: string | null) => void;
}

type PinStep = 'choice' | 'enter' | 'confirm';

export function PinSetup({ onComplete }: PinSetupProps) {
  const [step, setStep] = useState<PinStep>('choice');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string>();

  const handlePinChange = useCallback((value: string, isConfirm: boolean) => {
    // Only allow digits
    const digits = value.replace(/\D/g, '').slice(0, MAX_PIN_LENGTH);

    if (isConfirm) {
      setConfirmPin(digits);
    } else {
      setPin(digits);
    }
    setError(undefined);
  }, []);

  const handleSubmitPin = useCallback(() => {
    const validation = validatePin(pin);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setStep('confirm');
  }, [pin]);

  const handleConfirmPin = useCallback(() => {
    console.log('handleConfirmPin called, pin:', pin, 'confirmPin:', confirmPin);
    if (pin !== confirmPin) {
      console.log('PINs do not match');
      setError('PINs do not match');
      setConfirmPin('');
      return;
    }
    console.log('Calling onComplete with pin');
    onComplete(pin);
  }, [pin, confirmPin, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete(null);
  }, [onComplete]);

  const handleBack = useCallback(() => {
    if (step === 'confirm') {
      setStep('enter');
      setConfirmPin('');
    } else {
      setStep('choice');
      setPin('');
    }
    setError(undefined);
  }, [step]);

  // Choice step - enable PIN or skip
  if (step === 'choice') {
    console.log('Rendering choice step');
    return (
      <div className="space-y-4">
        <Button
          type="button"
          onClick={() => {
            console.log('Set a PIN clicked, going to enter step');
            setStep('enter');
          }}
          variant="default"
          className="w-full h-12"
        >
          Set a PIN
        </Button>
        <Button
          type="button"
          onClick={handleSkip}
          variant="outline"
          className="w-full h-12"
        >
          Skip for now
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          You can always add a PIN later in settings.
        </p>
      </div>
    );
  }

  // Enter PIN step
  if (step === 'enter') {
    console.log('Rendering enter step, pin length:', pin.length);
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Enter a {MIN_PIN_LENGTH}-{MAX_PIN_LENGTH} digit PIN
          </label>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="••••"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value, false)}
            className={cn(
              'text-center text-2xl tracking-[0.5em] h-14',
              error && 'border-destructive'
            )}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitPin()}
          />
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={() => {
              console.log('Continue clicked, pin:', pin);
              handleSubmitPin();
            }}
            disabled={pin.length < MIN_PIN_LENGTH}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Confirm PIN step
  console.log('Rendering confirm step, confirmPin length:', confirmPin.length);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Confirm your PIN
        </label>
        <Input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="••••"
          value={confirmPin}
          onChange={(e) => handlePinChange(e.target.value, true)}
          className={cn(
            'text-center text-2xl tracking-[0.5em] h-14',
            error && 'border-destructive'
          )}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleConfirmPin()}
        />
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            console.log('Set PIN button clicked!');
            handleConfirmPin();
          }}
          disabled={confirmPin.length < MIN_PIN_LENGTH}
          className="flex-1"
        >
          Set PIN
        </Button>
      </div>
    </div>
  );
}

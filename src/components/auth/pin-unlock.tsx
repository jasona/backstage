'use client';

/**
 * PIN unlock component for protected dashboard access.
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';
import { Lock, Loader2, XCircle } from 'lucide-react';

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000; // 30 seconds

export function PinUnlock() {
  const router = useRouter();
  const { unlock, isAuthenticated } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        setLockedUntil(null);
        setAttempts(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handlePinChange = useCallback((value: string) => {
    // Only allow digits, max 8
    const digits = value.replace(/\D/g, '').slice(0, 8);
    setPin(digits);
    setError(undefined);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isLocked || !pin) return;

    setIsLoading(true);
    setError(undefined);

    try {
      const success = await unlock(pin);

      if (success) {
        router.push('/');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin('');

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_DURATION);
          setError(`Too many attempts. Please wait ${LOCKOUT_DURATION / 1000} seconds.`);
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [pin, unlock, router, attempts, isLocked]);

  return (
    <Card className="w-full max-w-sm bg-surface border-border-subtle">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <CardTitle>Enter PIN</CardTitle>
        <CardDescription>
          Enter your PIN to access the dashboard
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="••••"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            className={cn(
              'text-center text-2xl tracking-[0.5em] h-14',
              error && 'border-destructive'
            )}
            disabled={isLocked || isLoading}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          {error && (
            <div className="flex items-center justify-center gap-2 text-sm text-destructive">
              <XCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {isLocked && countdown > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Try again in {countdown}s
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!pin || pin.length < 4 || isLocked || isLoading}
          className="w-full h-12"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Unlock'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

'use client';

/**
 * Authentication provider for PIN-based protection.
 * Manages authentication state and session.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { getConfig, hasPinEnabled, getPinHash } from '@/lib/storage';
import { verifyPin } from '@/lib/pin';

interface AuthContextValue {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether the app has been configured (setup wizard completed) */
  isConfigured: boolean;
  /** Whether PIN protection is enabled */
  hasPinProtection: boolean;
  /** Whether the auth state is still loading */
  isLoading: boolean;
  /** Unlock the app with a PIN */
  unlock: (pin: string) => Promise<boolean>;
  /** Lock the app (require re-authentication) */
  lock: () => void;
  /** Refresh the auth state from storage */
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [hasPinProtection, setHasPinProtection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state from localStorage
  const refresh = useCallback(() => {
    const config = getConfig();

    if (config) {
      setIsConfigured(config.isConfigured);
      setHasPinProtection(Boolean(config.pinHash));

      // If no PIN protection, auto-authenticate
      if (!config.pinHash && config.isConfigured) {
        setIsAuthenticated(true);
      }
    } else {
      setIsConfigured(false);
      setHasPinProtection(false);
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Unlock with PIN
  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const pinHash = getPinHash();

    if (!pinHash) {
      // No PIN set, just authenticate
      setIsAuthenticated(true);
      return true;
    }

    const isValid = await verifyPin(pin, pinHash);

    if (isValid) {
      setIsAuthenticated(true);
      return true;
    }

    return false;
  }, []);

  // Lock the app
  const lock = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    isConfigured,
    hasPinProtection,
    isLoading,
    unlock,
    lock,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

'use client';

/**
 * Authentication provider for PIN-based protection.
 * Uses server-side PIN storage for security.
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

interface AuthStatus {
  isConfigured: boolean;
  hasPinProtection: boolean;
}

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
  /** Refresh the auth state from server */
  refresh: () => Promise<void>;
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

  // Load auth status from server
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (!response.ok) {
        throw new Error('Failed to fetch auth status');
      }

      const status: AuthStatus = await response.json();

      setIsConfigured(status.isConfigured);
      setHasPinProtection(status.hasPinProtection);

      // If no PIN protection and configured, auto-authenticate
      if (!status.hasPinProtection && status.isConfigured) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to fetch auth status:', error);
      // On error, assume not configured
      setIsConfigured(false);
      setHasPinProtection(false);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Unlock with PIN (verify against server)
  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const result = await response.json();

      if (result.authenticated) {
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to verify PIN:', error);
      return false;
    }
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

'use client';

/**
 * Sonos provider for managing connection state and real-time updates.
 * Tracks connection status and provides context for the entire app.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sonosQueryKeys } from '@/hooks/use-sonos';
import { checkConnection } from '@/lib/sonos-api';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface SonosContextValue {
  connectionStatus: ConnectionStatus;
  lastUpdated: Date | null;
  reconnect: () => void;
}

const SonosContext = createContext<SonosContextValue | null>(null);

interface SonosProviderProps {
  children: ReactNode;
}

// How often to check connection health (30 seconds)
const CONNECTION_CHECK_INTERVAL = 30000;

export function SonosProvider({ children }: SonosProviderProps) {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Check connection status
  const checkConnectionStatus = useCallback(async () => {
    try {
      const isConnected = await checkConnection();
      if (isConnected) {
        setConnectionStatus('connected');
        setLastUpdated(new Date());
      } else {
        setConnectionStatus('disconnected');
      }
    } catch {
      setConnectionStatus('disconnected');
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(async () => {
    setConnectionStatus('connecting');
    await checkConnectionStatus();
    // Refetch all data
    queryClient.invalidateQueries({ queryKey: sonosQueryKeys.zones });
  }, [checkConnectionStatus, queryClient]);

  // Initial connection check and periodic health checks
  useEffect(() => {
    checkConnectionStatus();

    const interval = setInterval(checkConnectionStatus, CONNECTION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkConnectionStatus]);

  // Update lastUpdated when zones data changes successfully
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.query.queryKey[0] === 'zones' &&
        event.query.state.status === 'success'
      ) {
        setConnectionStatus('connected');
        setLastUpdated(new Date());
      } else if (
        event.type === 'updated' &&
        event.query.queryKey[0] === 'zones' &&
        event.query.state.status === 'error'
      ) {
        setConnectionStatus('disconnected');
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return (
    <SonosContext.Provider value={{ connectionStatus, lastUpdated, reconnect }}>
      {children}
    </SonosContext.Provider>
  );
}

export function useSonosConnection() {
  const context = useContext(SonosContext);
  if (!context) {
    throw new Error('useSonosConnection must be used within a SonosProvider');
  }
  return context;
}

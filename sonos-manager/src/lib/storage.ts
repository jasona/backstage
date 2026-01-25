/**
 * Local storage utilities for app configuration.
 * Handles persistence of setup config and PIN.
 */

import type { AppConfig } from '@/types/config';

const STORAGE_KEY = 'sonos-manager-config';

/**
 * Get the current app configuration from localStorage
 */
export function getConfig(): AppConfig | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const config = JSON.parse(stored) as AppConfig;

    // Validate required fields
    if (!config.seedIp || typeof config.isConfigured !== 'boolean') {
      return null;
    }

    return config;
  } catch {
    return null;
  }
}

/**
 * Save app configuration to localStorage
 */
export function setConfig(config: Partial<AppConfig>): AppConfig {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save config on server');
  }

  const existing = getConfig();
  const updated: AppConfig = {
    seedIp: config.seedIp ?? existing?.seedIp ?? '',
    pinHash: config.pinHash ?? existing?.pinHash,
    isConfigured: config.isConfigured ?? existing?.isConfigured ?? false,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Clear all app configuration from localStorage
 */
export function clearConfig(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if the app has been configured
 */
export function isConfigured(): boolean {
  const config = getConfig();
  return config?.isConfigured === true;
}

/**
 * Check if PIN protection is enabled
 */
export function hasPinEnabled(): boolean {
  const config = getConfig();
  return Boolean(config?.pinHash);
}

/**
 * Get the stored PIN hash
 */
export function getPinHash(): string | null {
  const config = getConfig();
  return config?.pinHash ?? null;
}

/**
 * Get the seed IP address
 */
export function getSeedIp(): string | null {
  const config = getConfig();
  return config?.seedIp ?? null;
}

/**
 * Update just the PIN hash
 */
export function setPinHash(pinHash: string | undefined): void {
  setConfig({ pinHash });
}

/**
 * Remove PIN protection
 */
export function removePinHash(): void {
  const config = getConfig();
  if (config) {
    const { ...rest } = config;
    delete rest.pinHash;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...rest,
      updatedAt: new Date().toISOString(),
    }));
  }
}

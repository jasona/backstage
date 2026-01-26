/**
 * Server-side configuration storage.
 * Stores PIN hash and app config in a JSON file on the server.
 * This ensures the PIN is secure and cannot be bypassed by client-side manipulation.
 */

import fs from 'fs';
import path from 'path';

interface ServerConfig {
  /** Hashed PIN for authentication (optional) */
  pinHash?: string;
  /** Whether the app has been configured */
  isConfigured: boolean;
  /** When the config was last updated */
  updatedAt: string;
}

const CONFIG_DIR = path.join(process.cwd(), '.config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'server-config.json');

/**
 * Ensure the config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Read the server configuration
 */
export function getServerConfig(): ServerConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as ServerConfig;
  } catch (error) {
    console.error('Failed to read server config:', error);
    return null;
  }
}

/**
 * Save the server configuration
 */
export function setServerConfig(config: Partial<ServerConfig>): ServerConfig {
  ensureConfigDir();

  const existing = getServerConfig();
  const updated: ServerConfig = {
    pinHash: config.pinHash ?? existing?.pinHash,
    isConfigured: config.isConfigured ?? existing?.isConfigured ?? false,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

/**
 * Check if the app is configured
 */
export function isServerConfigured(): boolean {
  const config = getServerConfig();
  return config?.isConfigured === true;
}

/**
 * Check if a PIN is set
 */
export function hasServerPin(): boolean {
  const config = getServerConfig();
  return Boolean(config?.pinHash);
}

/**
 * Get the stored PIN hash
 */
export function getServerPinHash(): string | undefined {
  const config = getServerConfig();
  return config?.pinHash;
}

/**
 * Set the PIN hash (only if not already set, for initial setup)
 * Returns true if set successfully, false if PIN already exists
 */
export function setServerPinHash(pinHash: string): boolean {
  const existing = getServerConfig();

  // Don't allow overwriting existing PIN
  if (existing?.pinHash) {
    return false;
  }

  setServerConfig({ pinHash, isConfigured: true });
  return true;
}

/**
 * Update the PIN hash (for changing PIN when already authenticated)
 */
export function updateServerPinHash(pinHash: string | undefined): void {
  setServerConfig({ pinHash });
}

/**
 * Mark the app as configured (for setup without PIN)
 */
export function markServerConfigured(): void {
  setServerConfig({ isConfigured: true });
}

/**
 * Clear all server configuration (reset the app)
 */
export function clearServerConfig(): void {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  } catch (error) {
    console.error('Failed to clear server config:', error);
  }
}

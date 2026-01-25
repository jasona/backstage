/**
 * Application configuration types
 */

/** Main application configuration stored in localStorage */
export interface AppConfig {
  /** The seed IP address used to discover Sonos devices */
  seedIp: string;

  /** Hashed PIN for authentication (optional) */
  pinHash?: string;

  /** Whether the app has been configured */
  isConfigured: boolean;

  /** When the config was last updated */
  updatedAt: string;
}

/** Setup wizard state */
export interface SetupState {
  step: 'welcome' | 'ip-entry' | 'validating' | 'discovery' | 'pin-setup' | 'complete';
  seedIp: string;
  deviceCount?: number;
  error?: string;
  pinEnabled: boolean;
}

/** PIN setup form values */
export interface PinSetupValues {
  pin: string;
  confirmPin: string;
}

/** Connection status */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

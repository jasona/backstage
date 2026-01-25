/**
 * Tests for storage utilities
 */

import {
  getConfig,
  setConfig,
  clearConfig,
  isConfigured,
  hasPinEnabled,
  getSeedIp,
} from './storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return null when no config exists', () => {
      const config = getConfig();
      expect(config).toBeNull();
    });

    it('should return config when valid config exists', () => {
      const mockConfig = {
        seedIp: '192.168.1.100',
        isConfigured: true,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockConfig));

      const config = getConfig();

      expect(config).toEqual(mockConfig);
    });

    it('should return null for invalid JSON', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      const config = getConfig();

      expect(config).toBeNull();
    });

    it('should return null for config missing required fields', () => {
      const invalidConfig = { foo: 'bar' };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(invalidConfig));

      const config = getConfig();

      expect(config).toBeNull();
    });
  });

  describe('setConfig', () => {
    it('should save new config to localStorage', () => {
      const config = setConfig({
        seedIp: '192.168.1.100',
        isConfigured: true,
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(config.seedIp).toBe('192.168.1.100');
      expect(config.isConfigured).toBe(true);
      expect(config.updatedAt).toBeDefined();
    });

    it('should merge with existing config', () => {
      const existingConfig = {
        seedIp: '192.168.1.100',
        pinHash: 'existing-hash',
        isConfigured: true,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existingConfig));

      const config = setConfig({ seedIp: '192.168.1.200' });

      expect(config.seedIp).toBe('192.168.1.200');
      expect(config.pinHash).toBe('existing-hash');
    });
  });

  describe('clearConfig', () => {
    it('should remove config from localStorage', () => {
      clearConfig();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sonos-manager-config');
    });
  });

  describe('isConfigured', () => {
    it('should return false when no config exists', () => {
      expect(isConfigured()).toBe(false);
    });

    it('should return true when config exists and isConfigured is true', () => {
      const mockConfig = {
        seedIp: '192.168.1.100',
        isConfigured: true,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockConfig));

      expect(isConfigured()).toBe(true);
    });
  });

  describe('hasPinEnabled', () => {
    it('should return false when no PIN hash exists', () => {
      const mockConfig = {
        seedIp: '192.168.1.100',
        isConfigured: true,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockConfig));

      expect(hasPinEnabled()).toBe(false);
    });

    it('should return true when PIN hash exists', () => {
      const mockConfig = {
        seedIp: '192.168.1.100',
        pinHash: 'some-hash',
        isConfigured: true,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockConfig));

      expect(hasPinEnabled()).toBe(true);
    });
  });

  describe('getSeedIp', () => {
    it('should return null when no config exists', () => {
      expect(getSeedIp()).toBeNull();
    });

    it('should return seed IP when config exists', () => {
      const mockConfig = {
        seedIp: '192.168.1.100',
        isConfigured: true,
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockConfig));

      expect(getSeedIp()).toBe('192.168.1.100');
    });
  });
});

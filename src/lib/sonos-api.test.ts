/**
 * Tests for the Sonos API client
 */

import {
  getZones,
  play,
  pause,
  setVolume,
  pauseAll,
  resumeAll,
  joinGroup,
  leaveGroup,
  transformZonesToDevices,
  checkConnection,
  SonosApiError,
} from './sonos-api';
import type { ZonesResponse } from '@/types/sonos';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Sample zone data matching node-sonos-http-api format
const mockZonesResponse: ZonesResponse = [
  {
    uuid: 'zone-1',
    coordinator: {
      uuid: 'device-1',
      roomName: 'Living Room',
      coordinator: true,
      groupState: { volume: 50, mute: false },
      state: {
        volume: 50,
        mute: false,
        currentTrack: {
          artist: 'Test Artist',
          title: 'Test Song',
          album: 'Test Album',
          duration: 180,
          position: 30,
          type: 'track',
        },
        playbackState: 'PLAYING',
        playMode: { repeat: 'none', shuffle: false, crossfade: false },
      },
    },
    members: [
      {
        uuid: 'device-1',
        roomName: 'Living Room',
        coordinator: true,
        groupState: { volume: 50, mute: false },
        state: {
          volume: 50,
          mute: false,
          currentTrack: {
            artist: 'Test Artist',
            title: 'Test Song',
            album: 'Test Album',
            duration: 180,
            position: 30,
            type: 'track',
          },
          playbackState: 'PLAYING',
          playMode: { repeat: 'none', shuffle: false, crossfade: false },
        },
      },
      {
        uuid: 'device-2',
        roomName: 'Kitchen',
        coordinator: false,
        groupState: { volume: 40, mute: false },
        state: {
          volume: 40,
          mute: false,
          currentTrack: {
            artist: 'Test Artist',
            title: 'Test Song',
            album: 'Test Album',
            duration: 180,
            position: 30,
            type: 'track',
          },
          playbackState: 'PLAYING',
          playMode: { repeat: 'none', shuffle: false, crossfade: false },
        },
      },
    ],
  },
  {
    uuid: 'zone-2',
    coordinator: {
      uuid: 'device-3',
      roomName: 'Bedroom',
      coordinator: true,
      groupState: { volume: 30, mute: true },
      state: {
        volume: 30,
        mute: true,
        currentTrack: {
          artist: '',
          title: '',
          album: '',
          duration: 0,
          position: 0,
          type: '',
        },
        playbackState: 'STOPPED',
        playMode: { repeat: 'none', shuffle: false, crossfade: false },
      },
    },
    members: [
      {
        uuid: 'device-3',
        roomName: 'Bedroom',
        coordinator: true,
        groupState: { volume: 30, mute: true },
        state: {
          volume: 30,
          mute: true,
          currentTrack: {
            artist: '',
            title: '',
            album: '',
            duration: 0,
            position: 0,
            type: '',
          },
          playbackState: 'STOPPED',
          playMode: { repeat: 'none', shuffle: false, crossfade: false },
        },
      },
    ],
  },
];

describe('Sonos API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getZones', () => {
    it('should fetch and return zones', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockZonesResponse,
      } as Response);

      const zones = await getZones();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/zones',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(zones).toHaveLength(2);
      expect(zones[0].coordinator.roomName).toBe('Living Room');
    });

    it('should return empty array on invalid response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      } as Response);

      const zones = await getZones();
      expect(zones).toEqual([]);
    });

    it('should throw SonosApiError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getZones()).rejects.toThrow(SonosApiError);
    });

    it('should throw SonosApiError on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(getZones()).rejects.toThrow(SonosApiError);
    });
  });

  describe('transformZonesToDevices', () => {
    it('should transform zones to flat device list', () => {
      const devices = transformZonesToDevices(mockZonesResponse);

      expect(devices).toHaveLength(3);
      expect(devices[0].roomName).toBe('Living Room');
      expect(devices[0].isCoordinator).toBe(true);
      expect(devices[1].roomName).toBe('Kitchen');
      expect(devices[1].isCoordinator).toBe(false);
      expect(devices[2].roomName).toBe('Bedroom');
    });

    it('should include playback state and volume', () => {
      const devices = transformZonesToDevices(mockZonesResponse);

      expect(devices[0].playbackState).toBe('PLAYING');
      expect(devices[0].volume).toBe(50);
      expect(devices[2].playbackState).toBe('STOPPED');
      expect(devices[2].muted).toBe(true);
    });

    it('should include nowPlaying only when track has title', () => {
      const devices = transformZonesToDevices(mockZonesResponse);

      expect(devices[0].nowPlaying).toBeDefined();
      expect(devices[0].nowPlaying?.title).toBe('Test Song');
      expect(devices[2].nowPlaying).toBeUndefined();
    });
  });

  describe('playback controls', () => {
    it('should call play endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await play('Living Room');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/Living%20Room/play',
        expect.any(Object)
      );
    });

    it('should call pause endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await pause('Living Room');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/Living%20Room/pause',
        expect.any(Object)
      );
    });
  });

  describe('volume controls', () => {
    it('should call volume endpoint with clamped value', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await setVolume('Living Room', 75);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/Living%20Room/volume/75',
        expect.any(Object)
      );
    });

    it('should clamp volume to 0-100 range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await setVolume('Living Room', 150);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/Living%20Room/volume/100',
        expect.any(Object)
      );
    });

    it('should clamp negative volume to 0', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await setVolume('Living Room', -10);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/Living%20Room/volume/0',
        expect.any(Object)
      );
    });
  });

  describe('bulk operations', () => {
    it('should call pauseall endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await pauseAll();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/pauseall',
        expect.any(Object)
      );
    });

    it('should call resumeall endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await resumeAll();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/resumeall',
        expect.any(Object)
      );
    });
  });

  describe('grouping', () => {
    it('should call join endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await joinGroup('Kitchen', 'Living Room');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/Kitchen/join/Living%20Room',
        expect.any(Object)
      );
    });

    it('should call leave endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await leaveGroup('Kitchen');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5005/Kitchen/leave',
        expect.any(Object)
      );
    });
  });

  describe('checkConnection', () => {
    it('should return true when API is reachable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockZonesResponse,
      } as Response);

      const result = await checkConnection();
      expect(result).toBe(true);
    });

    it('should return false when API is not reachable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkConnection();
      expect(result).toBe(false);
    });
  });
});

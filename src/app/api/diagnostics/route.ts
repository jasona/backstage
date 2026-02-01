/**
 * Network diagnostics API route.
 * Aggregates data from node-sonos-http-api and direct device queries.
 * Uses in-memory caching with 2-minute TTL for faster responses.
 */

import { NextResponse } from 'next/server';
import {
  fetchDeviceStatus,
  detectConnectionType,
  supportsSonosNet,
} from '@/lib/sonos-device-api';
import type {
  NetworkTopology,
  DeviceNetworkDiagnostics,
} from '@/types/sonos';

const SONOS_API_URL = process.env.NEXT_PUBLIC_SONOS_API_URL || 'http://localhost:5005';

// Cache configuration
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

interface CacheEntry {
  data: NetworkTopology;
  timestamp: number;
}

// Module-level cache storage
let topologyCache: CacheEntry | null = null;

/**
 * Check if cache is valid (exists and not expired)
 */
function isCacheValid(): boolean {
  if (!topologyCache) return false;
  return Date.now() - topologyCache.timestamp < CACHE_TTL_MS;
}

/**
 * Get cached topology if valid
 */
function getCachedTopology(): NetworkTopology | null {
  if (isCacheValid()) {
    return topologyCache!.data;
  }
  return null;
}

/**
 * Store topology in cache
 */
function setCachedTopology(topology: NetworkTopology): void {
  topologyCache = {
    data: topology,
    timestamp: Date.now(),
  };
}

interface ZoneMember {
  uuid: string;
  roomName: string;
  baseUrl?: string;
}

interface Zone {
  uuid: string;
  coordinator: {
    uuid: string;
    roomName: string;
    baseUrl?: string;
  };
  members: ZoneMember[];
}

/**
 * Extract IP address from baseUrl (e.g., "http://192.168.1.50:1400" -> "192.168.1.50")
 */
function extractIpFromBaseUrl(baseUrl: string | undefined): string | null {
  if (!baseUrl) return null;
  try {
    const url = new URL(baseUrl);
    return url.hostname;
  } catch {
    return null;
  }
}

/**
 * GET /api/diagnostics
 * Returns network topology with diagnostics for all devices
 * Uses 2-minute caching for faster responses
 */
export async function GET() {
  try {
    // Check cache first - return cached data if valid
    const cachedTopology = getCachedTopology();
    if (cachedTopology) {
      return NextResponse.json(cachedTopology);
    }

    // Step 1: Get all zones from node-sonos-http-api
    const zonesResponse = await fetch(`${SONOS_API_URL}/zones`, {
      cache: 'no-store',
    });

    if (!zonesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch zones from Sonos API' },
        { status: 502 }
      );
    }

    const zones: Zone[] = await zonesResponse.json();

    // Step 2: Extract unique devices with their baseUrl from zones
    const devices = new Map<string, { uuid: string; roomName: string; baseUrl?: string }>();
    for (const zone of zones) {
      for (const member of zone.members) {
        devices.set(member.uuid, {
          uuid: member.uuid,
          roomName: member.roomName,
          baseUrl: member.baseUrl,
        });
      }
    }

    // Step 3: Fetch device status for all devices in parallel using IP from baseUrl
    // Using fast endpoints (/status/wireless, /status/zp, /status/enetports)
    const statusPromises = Array.from(devices.values()).map(async ({ uuid, roomName, baseUrl }) => {
      const ipAddress = extractIpFromBaseUrl(baseUrl);
      if (!ipAddress) {
        return { uuid, roomName, ipAddress: null, statusInfo: null };
      }
      const statusInfo = await fetchDeviceStatus(ipAddress);
      return { uuid, roomName, ipAddress, statusInfo };
    });

    const deviceStatuses = await Promise.all(statusPromises);

    // Determine network topology: check if any device is wired or on SonosNet
    let hasWiredDevice = false;
    let hasSonosNetDevice = false;

    for (const { statusInfo } of deviceStatuses) {
      if (statusInfo?.ethernetConnected) {
        hasWiredDevice = true;
      }
      if (statusInfo?.wifiModeString === 'SONOSNET_MODE') {
        hasSonosNetDevice = true;
      }
    }

    // Build diagnostics for each device
    const diagnosticDevices: DeviceNetworkDiagnostics[] = [];

    for (const { uuid, roomName, ipAddress, statusInfo } of deviceStatuses) {
      if (!ipAddress) {
        // No IP address available - device may have issues
        diagnosticDevices.push({
          deviceId: uuid,
          roomName,
          ipAddress: '',
          macAddress: '',
          connectionType: 'unknown',
          isWired: false,
          signalQuality: 'offline',
          isReachable: false,
          lastSeen: new Date().toISOString(),
          modelNumber: 'Unknown',
          softwareVersion: 'Unknown',
          supportsSonosNet: true,
        });
        continue;
      }

      const modelNumber = statusInfo?.modelNumber || 'Unknown';
      const isWired = statusInfo?.ethernetConnected ?? false;
      const connectionType = statusInfo
        ? detectConnectionType(statusInfo, hasWiredDevice)
        : (hasSonosNetDevice ? 'sonosnet' : 'wifi');

      diagnosticDevices.push({
        deviceId: uuid,
        roomName,
        ipAddress,
        macAddress: statusInfo?.macAddress || '',
        connectionType,
        isWired,
        // Signal quality based on connection type (no SNR from fast endpoints)
        signalQuality: isWired ? 'excellent' : 'good',
        isReachable: true,
        lastSeen: new Date().toISOString(),
        modelNumber,
        softwareVersion: statusInfo?.softwareVersion || 'Unknown',
        supportsSonosNet: supportsSonosNet(modelNumber),
      });
    }

    // Build network topology
    const wiredDeviceIds = diagnosticDevices.filter(d => d.isWired).map(d => d.deviceId);

    const topology: NetworkTopology = {
      devices: diagnosticDevices,
      hasSonosNet: hasSonosNetDevice || hasWiredDevice,
      wiredDeviceIds,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the topology for subsequent requests
    setCachedTopology(topology);

    return NextResponse.json(topology);
  } catch (error) {
    console.error('Diagnostics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Network diagnostics API route.
 * Aggregates data from node-sonos-http-api and direct device queries.
 */

import { NextResponse } from 'next/server';
import {
  fetchDeviceStatus,
  parseNetworkMatrix,
  detectConnectionType,
  calculateSignalQuality,
  supportsSonosNet,
} from '@/lib/sonos-device-api';
import type {
  NetworkTopology,
  DeviceNetworkDiagnostics,
} from '@/types/sonos';

const SONOS_API_URL = process.env.NEXT_PUBLIC_SONOS_API_URL || 'http://localhost:5005';

interface RoomStateResponse {
  roomName?: string;
  playerName?: string;
  coordinator?: string;
  uuid?: string;
  serialNum?: string;
  macAddress?: string;
  ipAddress?: string;
  modelNumber?: string;
  modelName?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
}

interface ZoneMember {
  uuid: string;
  roomName: string;
}

interface Zone {
  uuid: string;
  coordinator: {
    uuid: string;
    roomName: string;
  };
  members: ZoneMember[];
}

/**
 * GET /api/diagnostics
 * Returns network topology with diagnostics for all devices
 */
export async function GET() {
  try {
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

    // Step 2: Extract unique rooms
    const rooms = new Map<string, { uuid: string; roomName: string }>();
    for (const zone of zones) {
      for (const member of zone.members) {
        rooms.set(member.uuid, { uuid: member.uuid, roomName: member.roomName });
      }
    }

    // Step 3: Fetch state for each room to get IP addresses
    const devicePromises = Array.from(rooms.values()).map(async ({ uuid, roomName }) => {
      try {
        const stateResponse = await fetch(
          `${SONOS_API_URL}/${encodeURIComponent(roomName)}/state`,
          { cache: 'no-store' }
        );

        if (!stateResponse.ok) {
          return { uuid, roomName, state: null };
        }

        const state: RoomStateResponse = await stateResponse.json();
        return { uuid, roomName, state };
      } catch {
        return { uuid, roomName, state: null };
      }
    });

    const deviceStates = await Promise.all(devicePromises);

    // Step 4: Query each device directly for network info
    const devices: DeviceNetworkDiagnostics[] = [];

    // First pass: collect IPs and fetch device status
    const ipToDevice = new Map<string, { uuid: string; roomName: string; state: RoomStateResponse }>();

    for (const { uuid, roomName, state } of deviceStates) {
      if (state?.ipAddress) {
        ipToDevice.set(state.ipAddress, { uuid, roomName, state });
      }
    }

    // Check if any device is wired
    let hasWiredDevice = false;

    for (const { state } of deviceStates) {
      if (state?.ipAddress) {
        const statusInfo = await fetchDeviceStatus(state.ipAddress);
        if (statusInfo?.ethernetConnected) {
          hasWiredDevice = true;
          break;
        }
      }
    }

    // Second pass: build full diagnostics
    for (const { uuid, roomName, state } of deviceStates) {
      if (!state) {
        // Device state fetch failed - device may be offline
        devices.push({
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

      // If we got state from node-sonos-http-api, the device is reachable
      // The direct device query (port 1400) is optional enhancement
      const ipAddress = state.ipAddress || '';

      // Try to fetch detailed device status (optional - may fail due to network/firewall)
      let statusInfo = null;
      let snr: number | undefined;

      if (ipAddress) {
        statusInfo = await fetchDeviceStatus(ipAddress);

        // Get SNR from network matrix (if available)
        if (statusInfo) {
          const networkMatrix = await parseNetworkMatrix(ipAddress);
          if (networkMatrix.length > 0) {
            const snrValues = networkMatrix.filter(e => e.snr !== undefined).map(e => e.snr!);
            if (snrValues.length > 0) {
              snr = Math.round(snrValues.reduce((a, b) => a + b, 0) / snrValues.length);
            }
          }
        }
      }

      const modelNumber = statusInfo?.modelNumber || state.modelNumber || 'Unknown';
      const isWired = statusInfo?.ethernetConnected ?? false;
      const connectionType = statusInfo
        ? detectConnectionType(statusInfo, hasWiredDevice)
        : (hasWiredDevice ? 'sonosnet' : 'wifi');

      devices.push({
        deviceId: uuid,
        roomName,
        ipAddress,
        macAddress: statusInfo?.macAddress || state.macAddress || '',
        connectionType,
        isWired,
        snr,
        // Device is reachable if we got state from node-sonos-http-api
        // Signal quality defaults to 'good' if we can't query directly
        signalQuality: isWired ? 'excellent' : (statusInfo ? calculateSignalQuality(snr) : 'good'),
        isReachable: true, // We got it from node-sonos-http-api, so it's reachable
        lastSeen: new Date().toISOString(),
        modelNumber,
        softwareVersion: statusInfo?.softwareVersion || state.softwareVersion || 'Unknown',
        supportsSonosNet: supportsSonosNet(modelNumber),
      });
    }

    // Build network topology
    const wiredDeviceIds = devices.filter(d => d.isWired).map(d => d.deviceId);

    const topology: NetworkTopology = {
      devices,
      hasSonosNet: hasWiredDevice,
      wiredDeviceIds,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(topology);
  } catch (error) {
    console.error('Diagnostics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

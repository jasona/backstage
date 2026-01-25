/**
 * Client-side API functions for network diagnostics.
 * Fetches data from our Next.js API route which aggregates device info.
 */

import type {
  NetworkTopology,
  NetworkHealthSummary,
  NetworkIssue,
  DeviceNetworkDiagnostics,
} from '@/types/sonos';

/**
 * Fetch network diagnostics topology from the API
 */
export async function getNetworkDiagnostics(): Promise<NetworkTopology> {
  const response = await fetch('/api/diagnostics', {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch diagnostics: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate network health summary from topology data
 */
export function calculateNetworkHealth(topology: NetworkTopology): NetworkHealthSummary {
  const devices = topology.devices;
  const issues: NetworkIssue[] = [];

  // Count device states
  const onlineDevices = devices.filter(d => d.isReachable).length;
  const offlineDevices = devices.filter(d => !d.isReachable).length;
  const sonosNetDevices = devices.filter(d => d.connectionType === 'sonosnet').length;
  const wifiDevices = devices.filter(d => d.connectionType === 'wifi').length;
  const wiredDevices = devices.filter(d => d.isWired).length;
  const poorSignalDevices = devices
    .filter(d => d.signalQuality === 'poor' || d.signalQuality === 'fair')
    .map(d => d.roomName);

  // Detect issues

  // Offline devices
  for (const device of devices.filter(d => !d.isReachable)) {
    issues.push({
      severity: 'critical',
      roomName: device.roomName,
      type: 'device_offline',
      message: `${device.roomName} is offline or unreachable`,
      recommendation: 'Check that the device is powered on and connected to your network. Try rebooting the device.',
    });
  }

  // Poor signal
  for (const device of devices.filter(d => d.signalQuality === 'poor' && d.isReachable)) {
    issues.push({
      severity: 'warning',
      roomName: device.roomName,
      type: 'weak_signal',
      message: `${device.roomName} has poor signal strength${device.snr ? ` (SNR: ${device.snr} dB)` : ''}`,
      recommendation: 'Move the device closer to your router or a wired Sonos speaker. Consider adding a wired Sonos device to create a SonosNet mesh.',
    });
  }

  // Fair signal (less severe)
  for (const device of devices.filter(d => d.signalQuality === 'fair' && d.isReachable)) {
    issues.push({
      severity: 'info',
      roomName: device.roomName,
      type: 'weak_signal',
      message: `${device.roomName} has fair signal strength${device.snr ? ` (SNR: ${device.snr} dB)` : ''}`,
      recommendation: 'Signal is adequate but could be improved. Consider repositioning the device or adding a wired Sonos speaker nearby.',
    });
  }

  // No SonosNet (all on WiFi)
  if (!topology.hasSonosNet && devices.length > 0 && offlineDevices < devices.length) {
    // Check if any device supports SonosNet
    const sonosNetCapableDevices = devices.filter(d => d.supportsSonosNet);
    if (sonosNetCapableDevices.length > 0) {
      issues.push({
        severity: 'info',
        type: 'no_sonosnet',
        message: 'All devices are on WiFi. No SonosNet mesh is active.',
        recommendation: 'Connect any Sonos speaker to your router with an ethernet cable to create a dedicated SonosNet mesh network for better reliability.',
      });
    }
  }

  // WiFi-only devices
  for (const device of devices.filter(d => !d.supportsSonosNet && d.isReachable)) {
    if (device.signalQuality !== 'excellent' && device.signalQuality !== 'good') {
      issues.push({
        severity: 'info',
        roomName: device.roomName,
        type: 'wifi_only',
        message: `${device.roomName} can only connect via WiFi (${device.modelNumber})`,
        recommendation: 'This device (Era, Move, or Roam) cannot use SonosNet. Ensure good WiFi coverage in this area.',
      });
    }
  }

  // Determine overall health
  let overallHealth: 'healthy' | 'warning' | 'critical';
  if (issues.some(i => i.severity === 'critical')) {
    overallHealth = 'critical';
  } else if (issues.some(i => i.severity === 'warning')) {
    overallHealth = 'warning';
  } else {
    overallHealth = 'healthy';
  }

  return {
    totalDevices: devices.length,
    onlineDevices,
    offlineDevices,
    sonosNetDevices,
    wifiDevices,
    wiredDevices,
    poorSignalDevices,
    hasSonosNet: topology.hasSonosNet,
    overallHealth,
    issues,
  };
}

/**
 * Get network health from the API (convenience function)
 */
export async function getNetworkHealth(): Promise<NetworkHealthSummary> {
  const topology = await getNetworkDiagnostics();
  return calculateNetworkHealth(topology);
}

/**
 * Get diagnostics for a specific device
 */
export function getDeviceDiagnostics(
  topology: NetworkTopology,
  deviceId: string
): DeviceNetworkDiagnostics | undefined {
  return topology.devices.find(d => d.deviceId === deviceId);
}

/**
 * Direct Sonos device API utilities.
 * Communicates directly with Sonos devices at port 1400 for diagnostics data
 * that isn't available through node-sonos-http-api.
 */

import * as cheerio from 'cheerio';
import type {
  NetworkConnectionType,
  SignalQuality,
} from '@/types/sonos';

// Timeout for device requests (faster endpoints respond quickly)
const DEVICE_TIMEOUT = 5000;

/** Raw device status info from /status/info endpoint */
export interface DeviceStatusInfo {
  serialNumber?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
  ipAddress?: string;
  macAddress?: string;
  modelNumber?: string;
  modelName?: string;
  zoneName?: string;
  ethernetConnected?: boolean;
  wifiEnabled?: boolean;
  /** Wireless mode string: 'SONOSNET_MODE' or 'STATION_MODE' (WiFi) */
  wifiModeString?: string;
}

/** Network matrix entry from /support/review */
export interface NetworkMatrixEntry {
  deviceName: string;
  ipAddress: string;
  snr?: number;
  rssi?: number;
}

// WiFi-only models that never use SonosNet (Era, Move, Roam series)
const WIFI_ONLY_MODELS = [
  'S31', // Era 300
  'S33', // Era 300 variant
  'S34', // Era 100
  'S27', // Move
  'S35', // Move 2
  'S36', // Roam
  'S38', // Roam SL
];

/**
 * Fetch a single endpoint with timeout
 */
async function fetchWithTimeout(url: string, timeout: number = DEVICE_TIMEOUT): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Parse /status/wireless XML response
 * Returns WifiModeString (SONOSNET_MODE or STATION_MODE)
 */
function parseWirelessStatus(xmlText: string): { wifiModeString?: string } {
  const $ = cheerio.load(xmlText, { xmlMode: true });
  return {
    wifiModeString: $('WifiModeString').text() || undefined,
  };
}

/**
 * Parse /status/zp XML response
 * Returns MAC, serial, software version, model info
 */
function parseZpStatus(xmlText: string): Partial<DeviceStatusInfo> {
  const $ = cheerio.load(xmlText, { xmlMode: true });
  return {
    serialNumber: $('SerialNumber').text() || undefined,
    softwareVersion: $('SoftwareVersion').text() || undefined,
    hardwareVersion: $('HardwareVersion').text() || undefined,
    macAddress: $('MACAddress').text() || undefined,
    modelNumber: $('SeriesID').text() || undefined,
    ipAddress: $('IPAddress').text() || undefined,
  };
}

/**
 * Parse /status/enetports XML response
 * Returns ethernet link status
 */
function parseEnetPortsStatus(xmlText: string): { ethernetConnected: boolean } {
  const $ = cheerio.load(xmlText, { xmlMode: true });
  // EnetPorts contains Port elements with Link child (1 = connected, 0 = disconnected)
  const linkText = $('Port Link').first().text();
  return {
    ethernetConnected: linkText === '1',
  };
}

/**
 * Fetch device status info using fast, focused endpoints
 * Calls /status/wireless, /status/zp, and /status/enetports in parallel
 */
export async function fetchDeviceStatus(ip: string): Promise<DeviceStatusInfo | null> {
  try {
    // Fetch all three endpoints in parallel for speed
    const [wirelessXml, zpXml, enetXml] = await Promise.all([
      fetchWithTimeout(`http://${ip}:1400/status/wireless`),
      fetchWithTimeout(`http://${ip}:1400/status/zp`),
      fetchWithTimeout(`http://${ip}:1400/status/enetports`),
    ]);

    // If none of the endpoints responded, device is unreachable
    if (!wirelessXml && !zpXml && !enetXml) {
      return null;
    }

    // Parse each response and merge the results
    const wirelessInfo = wirelessXml ? parseWirelessStatus(wirelessXml) : {};
    const zpInfo = zpXml ? parseZpStatus(zpXml) : {};
    const enetInfo = enetXml ? parseEnetPortsStatus(enetXml) : { ethernetConnected: false };

    return {
      ...zpInfo,
      ...wirelessInfo,
      ...enetInfo,
      wifiEnabled: true, // If we can query it, WiFi is enabled
    };
  } catch {
    // Device unreachable or timed out
    return null;
  }
}


/**
 * Parse the network matrix from /support/review endpoint
 * This contains SNR (signal-to-noise ratio) data between devices
 */
export async function parseNetworkMatrix(ip: string): Promise<NetworkMatrixEntry[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEVICE_TIMEOUT);

    const response = await fetch(`http://${ip}:1400/support/review`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const htmlText = await response.text();
    return extractNetworkMatrixFromHtml(htmlText);
  } catch (error) {
    console.warn(`Failed to fetch network matrix from ${ip}:`, error);
    return [];
  }
}

/**
 * Extract network matrix data from the support/review HTML page
 */
function extractNetworkMatrixFromHtml(htmlText: string): NetworkMatrixEntry[] {
  const $ = cheerio.load(htmlText);
  const entries: NetworkMatrixEntry[] = [];

  // Look for the network matrix table in the support page
  // The table contains rows with device name, IP, and signal info
  $('table').each((_, table) => {
    const $table = $(table);
    const headerText = $table.text().toLowerCase();

    // Find tables that might contain network/wireless information
    if (headerText.includes('network') || headerText.includes('wireless') || headerText.includes('topology')) {
      $table.find('tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          const deviceName = $(cells[0]).text().trim();
          const ipMatch = $(row).text().match(/\d+\.\d+\.\d+\.\d+/);
          const snrMatch = $(row).text().match(/SNR[:\s]*(\d+)/i);
          const rssiMatch = $(row).text().match(/RSSI[:\s]*(-?\d+)/i);

          if (deviceName && ipMatch) {
            entries.push({
              deviceName,
              ipAddress: ipMatch[0],
              snr: snrMatch ? parseInt(snrMatch[1], 10) : undefined,
              rssi: rssiMatch ? parseInt(rssiMatch[1], 10) : undefined,
            });
          }
        }
      });
    }
  });

  return entries;
}

/**
 * Detect the connection type for a device based on its reported wireless mode.
 * Sonos devices report WifiModeString as 'SONOSNET_MODE' or 'STATION_MODE' (WiFi).
 */
export function detectConnectionType(
  deviceInfo: DeviceStatusInfo,
  hasWiredDevice: boolean
): NetworkConnectionType {
  // Device is wired via ethernet
  if (deviceInfo.ethernetConnected) {
    return 'ethernet';
  }

  // Use the device's reported wireless mode if available
  if (deviceInfo.wifiModeString === 'SONOSNET_MODE') {
    return 'sonosnet';
  }

  if (deviceInfo.wifiModeString === 'STATION_MODE') {
    return 'wifi';
  }

  // Fallback for devices without WifiModeString (older firmware or WiFi-only models)
  // WiFi-only models (Era, Move, Roam) never use SonosNet
  if (deviceInfo.modelNumber && WIFI_ONLY_MODELS.includes(deviceInfo.modelNumber)) {
    return 'wifi';
  }

  // Legacy fallback: infer from network topology
  if (hasWiredDevice) {
    return 'sonosnet';
  }

  return 'wifi';
}

/**
 * Check if a model supports SonosNet
 */
export function supportsSonosNet(modelNumber: string | undefined): boolean {
  if (!modelNumber) return true; // Assume older models support it
  return !WIFI_ONLY_MODELS.includes(modelNumber);
}

/**
 * Calculate signal quality from SNR (Signal-to-Noise Ratio)
 * Based on typical WiFi/SonosNet thresholds:
 * - Excellent: SNR >= 45 dB
 * - Good: SNR 35-44 dB
 * - Fair: SNR 25-34 dB
 * - Poor: SNR < 25 dB
 */
export function calculateSignalQuality(snr: number | undefined): SignalQuality {
  if (snr === undefined) {
    return 'good'; // Default to good if we can't measure
  }

  if (snr >= 45) {
    return 'excellent';
  } else if (snr >= 35) {
    return 'good';
  } else if (snr >= 25) {
    return 'fair';
  } else {
    return 'poor';
  }
}

/**
 * Get signal quality description
 */
export function getSignalQualityDescription(quality: SignalQuality): string {
  switch (quality) {
    case 'excellent':
      return 'Excellent signal strength';
    case 'good':
      return 'Good signal strength';
    case 'fair':
      return 'Fair signal - may experience occasional dropouts';
    case 'poor':
      return 'Poor signal - likely to experience playback issues';
    case 'offline':
      return 'Device is offline';
  }
}

/**
 * Get connection type display label
 */
export function getConnectionTypeLabel(type: NetworkConnectionType): string {
  switch (type) {
    case 'ethernet':
      return 'Wired (Ethernet)';
    case 'sonosnet':
      return 'SonosNet';
    case 'wifi':
      return 'WiFi';
    case 'unknown':
      return 'Unknown';
  }
}

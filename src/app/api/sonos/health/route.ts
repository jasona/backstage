/**
 * Health check endpoint for Sonos API connection.
 * Used by the setup wizard to verify the backend is reachable.
 */

import { NextResponse } from 'next/server';

const SONOS_API_URL = process.env.SONOS_API_URL || process.env.NEXT_PUBLIC_SONOS_API_URL || 'http://localhost:5005';

export async function GET() {
  try {
    const response = await fetch(`${SONOS_API_URL}/zones`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { connected: false, error: `API returned ${response.status}` },
        { status: 200 }
      );
    }

    const zones = await response.json();
    const deviceCount = Array.isArray(zones)
      ? zones.reduce((count: number, zone: { members?: unknown[] }) => count + (zone.members?.length || 0), 0)
      : 0;

    return NextResponse.json({
      connected: true,
      deviceCount,
      apiUrl: SONOS_API_URL,
    });
  } catch (error) {
    console.error('Sonos health check failed:', error);
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      },
      { status: 200 }
    );
  }
}

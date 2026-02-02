/**
 * Proxy route for album art images.
 * Fetches images from Sonos devices or external sources and serves them,
 * avoiding mixed content issues when the app is served over HTTPS.
 */

import { NextRequest, NextResponse } from 'next/server';

const SONOS_API_URL = process.env.SONOS_API_URL || process.env.NEXT_PUBLIC_SONOS_API_URL || 'http://localhost:5005';

export async function GET(request: NextRequest) {
  const b64 = request.nextUrl.searchParams.get('b64');
  const room = request.nextUrl.searchParams.get('room');
  const url = request.nextUrl.searchParams.get('url');

  if (!b64 && !url) {
    return NextResponse.json(
      { error: 'Missing url or b64 parameter' },
      { status: 400 }
    );
  }

  try {
    // Decode the URL - prefer base64 encoding to avoid double-encoding issues
    let decodedUrl: string;
    if (b64) {
      decodedUrl = Buffer.from(b64, 'base64').toString('utf-8');
    } else {
      decodedUrl = url!;
    }

    // Normalize double-encoded sequences (%25XX -> %XX)
    // but don't fully decode as that would break query parameter structure
    let normalized = decodedUrl;
    // Replace %25 (encoded %) with % to fix double-encoding
    // Keep doing it until no more double-encoding exists
    while (normalized.includes('%25')) {
      normalized = normalized.replace(/%25/g, '%');
    }

    // Determine the full URL to fetch
    let fetchUrl: string;
    if (normalized.startsWith('/getaa')) {
      // Album art from Sonos - needs room name prefix for the HTTP API
      if (!room) {
        return NextResponse.json(
          { error: 'Missing room parameter for album art' },
          { status: 400 }
        );
      }
      // Convert /getaa?... to /{room}/getaa?...
      const encodedRoom = encodeURIComponent(room);
      fetchUrl = `${SONOS_API_URL}/${encodedRoom}${normalized}`;
    } else if (normalized.startsWith('/')) {
      // Other relative path - prepend the Sonos API URL
      fetchUrl = `${SONOS_API_URL}${normalized}`;
    } else {
      // Full URL - use as-is
      fetchUrl = normalized;
    }

    console.log('Fetching album art from:', fetchUrl);

    const response = await fetch(fetchUrl, {
      headers: {
        // Some servers require a user agent
        'User-Agent': 'Backstage/1.0',
      },
      cache: 'force-cache', // Cache album art aggressively
    });

    if (!response.ok) {
      console.error(`Album art fetch failed: ${response.status} ${response.statusText} for ${fetchUrl}`);
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Album art proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album art' },
      { status: 502 }
    );
  }
}

/**
 * Proxy route for album art images.
 * Fetches images from Sonos devices or external sources and serves them,
 * avoiding mixed content issues when the app is served over HTTPS.
 */

import { NextRequest, NextResponse } from 'next/server';

const SONOS_API_URL = process.env.SONOS_API_URL || process.env.NEXT_PUBLIC_SONOS_API_URL || 'http://localhost:5005';

export async function GET(request: NextRequest) {
  const b64 = request.nextUrl.searchParams.get('b64');
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
      decodedUrl = decodeURIComponent(url!);
    }

    // Fully decode any remaining percent-encoded characters
    // Some Sonos URLs come with inconsistent encoding (mix of single and double encoded)
    let fullyDecoded = decodedUrl;
    // Keep decoding until no more changes (handles double/triple encoding)
    let prev = '';
    while (prev !== fullyDecoded) {
      prev = fullyDecoded;
      try {
        fullyDecoded = decodeURIComponent(fullyDecoded);
      } catch {
        // Stop if we hit invalid encoding
        break;
      }
    }

    // Determine the full URL to fetch
    let fetchUrl: string;
    if (fullyDecoded.startsWith('/')) {
      // Relative path - prepend the Sonos API URL
      fetchUrl = `${SONOS_API_URL}${fullyDecoded}`;
    } else {
      // Full URL - use as-is
      fetchUrl = fullyDecoded;
    }

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

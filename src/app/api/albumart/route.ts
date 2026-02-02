/**
 * Proxy route for album art images.
 * Fetches images from Sonos devices or external sources and serves them,
 * avoiding mixed content issues when the app is served over HTTPS.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  try {
    // Decode the URL if it was encoded
    const decodedUrl = decodeURIComponent(url);

    const response = await fetch(decodedUrl, {
      headers: {
        // Some servers require a user agent
        'User-Agent': 'Backstage/1.0',
      },
      cache: 'force-cache', // Cache album art aggressively
    });

    if (!response.ok) {
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

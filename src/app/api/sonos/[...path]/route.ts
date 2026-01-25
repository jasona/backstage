/**
 * Proxy route for node-sonos-http-api.
 * Forwards all requests to the backend so clients don't need direct access.
 * This allows the app to work when accessed from other computers on the network.
 */

import { NextRequest, NextResponse } from 'next/server';

const SONOS_API_URL = process.env.SONOS_API_URL || process.env.NEXT_PUBLIC_SONOS_API_URL || 'http://localhost:5005';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetPath = '/' + path.join('/');
  const targetUrl = `${SONOS_API_URL}${targetPath}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Sonos API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Sonos proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Sonos API' },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetPath = '/' + path.join('/');
  const targetUrl = `${SONOS_API_URL}${targetPath}`;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON - that's ok for some endpoints
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Sonos API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Some endpoints return empty responses
    const text = await response.text();
    if (!text) {
      return NextResponse.json({ success: true });
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ success: true, response: text });
    }
  } catch (error) {
    console.error('Sonos proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Sonos API' },
      { status: 502 }
    );
  }
}

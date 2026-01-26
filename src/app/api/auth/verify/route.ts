/**
 * Auth verify endpoint.
 * Verifies a PIN against the stored hash and sets a session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig } from '@/lib/server-config';
import { verifyPin } from '@/lib/pin';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const config = getServerConfig();

    // If no PIN is set, authentication always succeeds
    if (!config?.pinHash) {
      await createSession();
      return NextResponse.json({
        success: true,
        authenticated: true,
      });
    }

    const body = await request.json();
    const { pin } = body as { pin?: string };

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      );
    }

    const isValid = await verifyPin(pin, config.pinHash);

    if (isValid) {
      // Create a session cookie that lasts 30 days
      await createSession();

      return NextResponse.json({
        success: true,
        authenticated: true,
      });
    } else {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: 'Invalid PIN',
      });
    }
  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    );
  }
}

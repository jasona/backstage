/**
 * Auth setup endpoint.
 * Sets up the initial PIN or marks the app as configured without PIN.
 * Only works if the app is not already configured (prevents hijacking).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig, setServerConfig } from '@/lib/server-config';
import { hashPin, validatePin } from '@/lib/pin';

export async function POST(request: NextRequest) {
  try {
    const config = getServerConfig();

    // Prevent overwriting existing configuration
    if (config?.isConfigured) {
      return NextResponse.json(
        { error: 'App is already configured. Use settings to change PIN.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { pin } = body as { pin?: string };

    if (pin) {
      // Validate PIN format
      const validation = validatePin(pin);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Hash and store the PIN
      const pinHash = await hashPin(pin);
      setServerConfig({ pinHash, isConfigured: true });

      return NextResponse.json({
        success: true,
        hasPinProtection: true,
      });
    } else {
      // Configure without PIN
      setServerConfig({ isConfigured: true });

      return NextResponse.json({
        success: true,
        hasPinProtection: false,
      });
    }
  } catch (error) {
    console.error('Auth setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup authentication' },
      { status: 500 }
    );
  }
}

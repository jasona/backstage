/**
 * Change PIN endpoint.
 * Allows authenticated users to change or remove their PIN.
 * Requires current PIN verification before changing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerConfig, updateServerPinHash } from '@/lib/server-config';
import { hashPin, verifyPin, validatePin } from '@/lib/pin';

export async function POST(request: NextRequest) {
  try {
    const config = getServerConfig();

    // App must be configured first
    if (!config?.isConfigured) {
      return NextResponse.json(
        { error: 'App is not configured' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { currentPin, newPin } = body as { currentPin?: string; newPin?: string };

    // If PIN is currently set, require current PIN for verification
    if (config.pinHash) {
      if (!currentPin) {
        return NextResponse.json(
          { error: 'Current PIN is required' },
          { status: 400 }
        );
      }

      const isValid = await verifyPin(currentPin, config.pinHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current PIN is incorrect' },
          { status: 401 }
        );
      }
    }

    // Handle new PIN
    if (newPin) {
      // Validate new PIN format
      const validation = validatePin(newPin);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Hash and store the new PIN
      const pinHash = await hashPin(newPin);
      updateServerPinHash(pinHash);

      return NextResponse.json({
        success: true,
        hasPinProtection: true,
      });
    } else {
      // Remove PIN protection
      updateServerPinHash(undefined);

      return NextResponse.json({
        success: true,
        hasPinProtection: false,
      });
    }
  } catch (error) {
    console.error('Change PIN error:', error);
    return NextResponse.json(
      { error: 'Failed to change PIN' },
      { status: 500 }
    );
  }
}

/**
 * Auth status endpoint.
 * Returns whether the app is configured, PIN protection status, and authentication state.
 * Checks the session cookie to determine if user is authenticated.
 */

import { NextResponse } from 'next/server';
import { getServerConfig } from '@/lib/server-config';
import { hasValidSession } from '@/lib/session';

export async function GET() {
  const config = getServerConfig();
  const isConfigured = config?.isConfigured ?? false;
  const hasPinProtection = Boolean(config?.pinHash);

  // Check if user has a valid session cookie
  let isAuthenticated = false;

  if (isConfigured) {
    if (hasPinProtection) {
      // With PIN protection, check for valid session
      isAuthenticated = await hasValidSession();
    } else {
      // Without PIN protection, always authenticated once configured
      isAuthenticated = true;
    }
  }

  return NextResponse.json({
    isConfigured,
    hasPinProtection,
    isAuthenticated,
  });
}

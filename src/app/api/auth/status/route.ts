/**
 * Auth status endpoint.
 * Returns whether the app is configured and whether PIN protection is enabled.
 */

import { NextResponse } from 'next/server';
import { getServerConfig } from '@/lib/server-config';

export async function GET() {
  const config = getServerConfig();

  return NextResponse.json({
    isConfigured: config?.isConfigured ?? false,
    hasPinProtection: Boolean(config?.pinHash),
  });
}

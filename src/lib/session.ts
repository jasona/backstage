/**
 * Session management utilities.
 * Creates and verifies signed session tokens stored in HTTP-only cookies.
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

// Session cookie configuration
export const SESSION_COOKIE_NAME = 'backstage_session';
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Get or create a secret key for signing sessions.
 * In production, this should be set via environment variable.
 * Falls back to a generated key stored in memory (reset on server restart).
 */
function getSecretKey(): string {
  // Use environment variable if available
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  // For development/simple deployments, use a deterministic key based on machine
  // This is less secure but works without configuration
  // In production, always set SESSION_SECRET environment variable
  const machineId = process.env.HOSTNAME || process.env.COMPUTERNAME || 'backstage';
  return crypto.createHash('sha256').update(`backstage-session-${machineId}`).digest('hex');
}

/**
 * Create a signed session token.
 */
function createSessionToken(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}:${random}`;

  const secret = getSecretKey();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `${payload}:${signature}`;
}

/**
 * Verify a session token.
 * Returns true if the token is valid and not expired.
 */
function verifySessionToken(token: string): boolean {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) {
      return false;
    }

    const [timestampStr, random, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) {
      return false;
    }

    // Check if token is expired (30 days)
    const maxAge = SESSION_MAX_AGE * 1000; // Convert to milliseconds
    if (Date.now() - timestamp > maxAge) {
      return false;
    }

    // Verify signature
    const payload = `${timestampStr}:${random}`;
    const secret = getSecretKey();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Create a session and set the cookie.
 * Call this after successful PIN verification.
 */
export async function createSession(): Promise<void> {
  const token = createSessionToken();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Check if the current request has a valid session.
 */
export async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return false;
  }

  return verifySessionToken(sessionCookie.value);
}

/**
 * Clear the session cookie.
 * Call this to log out the user.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

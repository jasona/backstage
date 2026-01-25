/**
 * PIN hashing and verification utilities.
 * Uses bcryptjs for secure password hashing.
 */

import bcrypt from 'bcryptjs';

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;

// Minimum PIN length
export const MIN_PIN_LENGTH = 4;

// Maximum PIN length
export const MAX_PIN_LENGTH = 8;

/**
 * Validate PIN format
 */
export function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!pin) {
    return { valid: false, error: 'PIN is required' };
  }

  if (pin.length < MIN_PIN_LENGTH) {
    return { valid: false, error: `PIN must be at least ${MIN_PIN_LENGTH} digits` };
  }

  if (pin.length > MAX_PIN_LENGTH) {
    return { valid: false, error: `PIN must be at most ${MAX_PIN_LENGTH} digits` };
  }

  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: 'PIN must contain only digits' };
  }

  return { valid: true };
}

/**
 * Hash a PIN using bcrypt
 */
export async function hashPin(pin: string): Promise<string> {
  const validation = validatePin(pin);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(pin, salt);
  return hash;
}

/**
 * Verify a PIN against a stored hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  if (!pin || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(pin, hash);
  } catch {
    return false;
  }
}

/**
 * Synchronous hash for testing/simple cases
 * Prefer async version for production
 */
export function hashPinSync(pin: string): string {
  const validation = validatePin(pin);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  return bcrypt.hashSync(pin, salt);
}

/**
 * Synchronous verify for testing/simple cases
 * Prefer async version for production
 */
export function verifyPinSync(pin: string, hash: string): boolean {
  if (!pin || !hash) {
    return false;
  }

  try {
    return bcrypt.compareSync(pin, hash);
  } catch {
    return false;
  }
}

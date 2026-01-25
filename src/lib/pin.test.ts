/**
 * Tests for PIN utilities
 */

import {
  validatePin,
  hashPin,
  verifyPin,
  hashPinSync,
  verifyPinSync,
  MIN_PIN_LENGTH,
  MAX_PIN_LENGTH,
} from './pin';

describe('PIN Utilities', () => {
  describe('validatePin', () => {
    it('should reject empty PIN', () => {
      const result = validatePin('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('PIN is required');
    });

    it('should reject PIN shorter than minimum', () => {
      const result = validatePin('123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`at least ${MIN_PIN_LENGTH}`);
    });

    it('should reject PIN longer than maximum', () => {
      const result = validatePin('123456789');
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`at most ${MAX_PIN_LENGTH}`);
    });

    it('should reject PIN with non-digit characters', () => {
      const result = validatePin('12a4');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('PIN must contain only digits');
    });

    it('should accept valid PIN', () => {
      const result = validatePin('1234');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept PIN at minimum length', () => {
      const pin = '1234'.slice(0, MIN_PIN_LENGTH);
      const result = validatePin(pin);
      expect(result.valid).toBe(true);
    });

    it('should accept PIN at maximum length', () => {
      const pin = '12345678'.slice(0, MAX_PIN_LENGTH);
      const result = validatePin(pin);
      expect(result.valid).toBe(true);
    });
  });

  describe('hashPin / verifyPin (async)', () => {
    it('should hash and verify a valid PIN', async () => {
      const pin = '1234';
      const hash = await hashPin(pin);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(pin);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash format

      const isValid = await verifyPin(pin, hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong PIN', async () => {
      const pin = '1234';
      const hash = await hashPin(pin);

      const isValid = await verifyPin('5678', hash);
      expect(isValid).toBe(false);
    });

    it('should throw on invalid PIN', async () => {
      await expect(hashPin('12')).rejects.toThrow();
    });

    it('should handle empty inputs in verify', async () => {
      expect(await verifyPin('', 'hash')).toBe(false);
      expect(await verifyPin('1234', '')).toBe(false);
    });
  });

  describe('hashPinSync / verifyPinSync', () => {
    it('should hash and verify a valid PIN', () => {
      const pin = '5678';
      const hash = hashPinSync(pin);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(pin);

      const isValid = verifyPinSync(pin, hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong PIN', () => {
      const pin = '5678';
      const hash = hashPinSync(pin);

      const isValid = verifyPinSync('1234', hash);
      expect(isValid).toBe(false);
    });

    it('should throw on invalid PIN', () => {
      expect(() => hashPinSync('ab')).toThrow();
    });
  });
});

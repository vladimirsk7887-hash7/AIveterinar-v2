import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../../services/crypto.js';

describe('crypto service', () => {
  it('encrypts and decrypts a string correctly', () => {
    const original = 'my-secret-telegram-token';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    expect(decrypt(encrypted)).toBe(original);
  });

  it('each encryption produces a unique ciphertext (random IV)', () => {
    const text = 'same-input';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);
    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });

  // Note: ENCRYPTION_KEY is captured at module import time, so runtime deletion
  // doesn't affect the module. This is by design — tested via setup.js env.

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    parts[2] = Buffer.from('tampered').toString('base64');
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('handles unicode strings', () => {
    const text = 'Привет мир 🐾';
    expect(decrypt(encrypt(text))).toBe(text);
  });
});

/**
 * AES-256-GCM encryption utility for sensitive PII fields (e.g. VPA/UPI IDs).
 *
 * Encryption key is sourced from the VPA_ENCRYPTION_KEY environment variable.
 * The key must be exactly 64 hex characters (32 bytes).
 *
 * Ciphertext format: `iv:authTag:encrypted` (all hex-encoded)
 *   - iv:       12-byte random initialization vector (24 hex chars)
 *   - authTag:  16-byte GCM authentication tag (32 hex chars)
 *   - encrypted: ciphertext (variable length)
 *
 * Generate a key:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits — recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
  const hex = process.env.VPA_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'VPA_ENCRYPTION_KEY must be set as a 64-character hex string (32 bytes). ' +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns `iv:authTag:ciphertext` (all hex).
 */
export function encryptVpa(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string produced by `encryptVpa`.
 * Returns the original plaintext.
 */
export function decryptVpa(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted VPA format');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Safely decrypt a VPA value that may be null, undefined, or already plaintext.
 * Returns decrypted VPA or null.
 */
export function decryptVpaSafe(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  // Encrypted values always have the iv:authTag:ciphertext format
  if (value.includes(':')) {
    try {
      return decryptVpa(value);
    } catch {
      // If decryption fails, return null rather than leaking ciphertext
      return null;
    }
  }

  // Legacy unencrypted value — return as-is (for migration compatibility)
  return value;
}

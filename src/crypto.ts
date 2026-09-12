import { encodeBase64, decodeBase64 } from "./utils";

const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const HASH_ALGORITHM = "SHA-256";
const ENCRYPTION_ALGORITHM = "AES-GCM";

/**
 * Derives a CryptoKey from a given master password and salt.
 * WHY: We need a strong cryptographic key derived from a human-readable password
 * to perform AES encryption. PBKDF2 with 600k iterations and SHA-256 provides
 * strong resistance against brute-force and dictionary attacks.
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);

  // Import the password into Web Crypto API as a raw key material
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive the AES-GCM key using PBKDF2
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: 256 },
    false, // extractable: false to prevent the key from being exported from memory
    ["encrypt", "decrypt"]
  );

  return key;
}

/**
 * Generates a random 16-byte salt.
 * WHY: A unique, random salt ensures that identical passwords yield different
 * cryptographic keys, defending against rainbow table attacks.
 */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH);
  window.crypto.getRandomValues(salt);
  return salt;
}

/**
 * Encrypts a plaintext string using the provided CryptoKey.
 * WHY: We must protect sensitive user data. AES-256-GCM provides both confidentiality
 * and authenticated encryption, meaning any tampering with the ciphertext will be detected.
 * Returns the Base64 encoded ciphertext and the IV used.
 */
export async function encryptString(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const plaintextBuffer = enc.encode(plaintext);

  // Generate a random 12-byte IV for AES-GCM
  const iv = new Uint8Array(IV_LENGTH);
  window.crypto.getRandomValues(iv);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv as any,
    },
    key,
    plaintextBuffer
  );

  return {
    ciphertext: encodeBase64(new Uint8Array(ciphertextBuffer)),
    iv: encodeBase64(iv),
  };
}

/**
 * Decrypts a Base64 encoded ciphertext using the provided CryptoKey and IV.
 * WHY: Recovers the plaintext for authorized users. AES-GCM will automatically
 * verify the authentication tag and throw an error if the data or password is incorrect.
 */
export async function decryptString(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const ciphertextBuffer = decodeBase64(ciphertextBase64);
  const iv = decodeBase64(ivBase64);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv as any,
      },
      key,
      ciphertextBuffer as any
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    // If decryption fails (wrong key or tampered data), Web Crypto API throws an OperationError.
    throw new Error("Incorrect password or corrupted vault.");
  }
}

/**
 * Utility to encode a Uint8Array into a Base64 string.
 * WHY: We need to store binary cryptographic outputs (like IVs, salts, and encrypted data)
 * as text in JSON format (metadata.json and vault.enc), which is supported by Google Drive.
 */
export function encodeBase64(buffer: Uint8Array): string {
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Utility to decode a Base64 string back into a Uint8Array.
 * WHY: We need to reconstruct binary cryptographic inputs from the stored text in JSON
 * to perform decryption and key derivation using the Web Crypto API.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

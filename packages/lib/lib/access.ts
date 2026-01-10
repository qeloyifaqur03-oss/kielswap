/**
 * Normalizes an access code:
 * - trims whitespace
 * - converts to uppercase
 * - replaces multiple spaces/invisible characters with single space
 */
export function normalizeCode(code: string): string {
  return code
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/**
 * Hashes an access code using HMAC-SHA256
 * Compatible with both Node.js and Edge runtime (uses Web Crypto API)
 * @param code - The code to hash (will be normalized)
 * @returns Hex string of the hash
 */
export async function hashCode(code: string): Promise<string> {
  const normalized = normalizeCode(code);
  const secret = process.env.ACCESS_SECRET;
  
  if (!secret) {
    throw new Error("ACCESS_SECRET is not set. Add it to .env.local and re-run the script.");
  }

  // Use Web Crypto API for Edge runtime compatibility
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(normalized);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}


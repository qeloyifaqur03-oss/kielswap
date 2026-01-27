import crypto from "crypto";
import { normalizeCode } from "./access";

/**
 * Synchronous version for Node.js scripts (uses Node.js crypto)
 * Only use this in scripts that run in Node.js environment (not Edge runtime)
 */
export function hashCodeSync(code: string): string {
  const normalized = normalizeCode(code);
  const secret = process.env.ACCESS_SECRET;
  
  if (!secret) {
    throw new Error("ACCESS_SECRET is not set. Add it to .env.local and re-run the script.");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(normalized)
    .digest("hex");
}




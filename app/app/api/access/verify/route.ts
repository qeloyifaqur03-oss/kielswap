import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { normalizeCode, hashCode } from "@/lib/access";
import { checkRateLimit, getClientIP } from "@/lib/api/rateLimit";
import { validateBody, routeSchemas } from "@/lib/api/validate";

// Generate UUID for edge runtime (Web Crypto API)
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Edge runtime for better performance
export const runtime = "edge";
// ams1 is no longer available on Vercel, using fra1 and dub1 instead
export const preferredRegion = ["fra1", "dub1"];

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const requestId = generateRequestId();
  
  try {
    // Rate limiting (note: edge runtime may have limitations, but we try)
    const ip = getClientIP(request);
    const rateLimitResult = await checkRateLimit('access-verify', ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMITED', retryAfter: rateLimitResult.retryAfter, requestId },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate body with Zod
    const validation = validateBody(routeSchemas['access-verify'], body, requestId);
    if (!validation.success) {
      console.error(`[access/verify] [${requestId}] Validation failed:`, validation.details);
      return NextResponse.json(
        { ok: false, error: validation.error, details: validation.details, requestId },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const trimmedCode = code.trim();

    // Normalize and hash the code
    const normalized = normalizeCode(trimmedCode);
    const hash = await hashCode(normalized);
    const accessKey = `access:${hash}`;

    // Single Redis GET operation
    const accessResult = await redis.get(accessKey);
    
    const t1 = Date.now();
    const verifyMs = t1 - t0;

    // Log timing (only in non-production)
    if (process.env.NODE_ENV !== "production") {
      console.log(`[access/verify] [${requestId}] verify_ms=${verifyMs} found=${!!accessResult}`);
    }

    // Check if access code exists
    if (!accessResult) {
      return NextResponse.json({ ok: false, requestId }, { status: 401 });
    }

    // Code is valid - set cookie (ks_access=1)
    const response = NextResponse.json({ ok: true, requestId });
    const isProduction = process.env.NODE_ENV === "production";
    const maxAge = 60 * 60 * 24 * 30; // 30 days

    response.cookies.set("ks_access", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: maxAge,
    });

    return response;
  } catch (error) {
    const t1 = Date.now();
    const verifyMs = t1 - t0;
    
    console.error(`[access/verify] [${requestId}] Error after ${verifyMs}ms:`, error);
    
    return NextResponse.json({ ok: false, error: 'INTERNAL', requestId }, { status: 500 });
  }
}



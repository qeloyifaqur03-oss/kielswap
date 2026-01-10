import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { normalizeCode, hashCode } from "@/lib/access";

// Edge runtime for better performance
export const runtime = "edge";
export const preferredRegion = ["ams1", "fra1", "dub1"];

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  
  try {
    const body = await request.json();
    const { code } = body;

    // Validate code
    if (!code || typeof code !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const trimmedCode = code.trim();
    if (trimmedCode.length < 4 || trimmedCode.length > 64) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

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
      console.log(`[access/verify] verify_ms=${verifyMs} found=${!!accessResult}`);
    }

    // Check if access code exists
    if (!accessResult) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // Code is valid - set cookie (ks_access=1)
    const response = NextResponse.json({ ok: true });
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
    
    if (process.env.NODE_ENV !== "production") {
      console.error(`[access/verify] Error after ${verifyMs}ms:`, error);
    } else {
      console.error("Error verifying access code:", error);
    }
    
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}



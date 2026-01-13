import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIP } from "@/lib/api/rateLimit";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = await checkRateLimit('access-logout', ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, error: 'RATE_LIMITED', retryAfter: rateLimitResult.retryAfter, requestId },
        { status: 429 }
      );
    }

    const response = NextResponse.json({ ok: true, requestId });
    const isProduction = process.env.NODE_ENV === "production";
    
    // Clear access cookie by setting maxAge to 0
    response.cookies.set("ks_access", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error(`[access/logout] [${requestId}] Error:`, error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL', requestId },
      { status: 500 }
    );
  }
}



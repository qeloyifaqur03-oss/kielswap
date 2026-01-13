import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIP } from "@/lib/api/rateLimit";
import { randomUUID } from "crypto";

export const dynamic = 'force-dynamic' // Force dynamic rendering due to headers usage

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = await checkRateLimit('access-check', ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { hasAccess: false, ok: false, error: 'RATE_LIMITED', retryAfter: rateLimitResult.retryAfter, requestId },
        { status: 429 }
      );
    }

    const accessCookie = request.cookies.get("ks_access");
    
    if (accessCookie && accessCookie.value === "1") {
      return NextResponse.json({ hasAccess: true, ok: true, requestId });
    }
    
    return NextResponse.json({ hasAccess: false, ok: true, requestId });
  } catch (error) {
    console.error(`[access/check] [${requestId}] Error:`, error);
    return NextResponse.json(
      { hasAccess: false, ok: false, error: 'INTERNAL', requestId },
      { status: 500 }
    );
  }
}



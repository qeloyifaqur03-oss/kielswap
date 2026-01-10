import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accessCookie = request.cookies.get("ks_access");
  
  if (accessCookie && accessCookie.value === "1") {
    return NextResponse.json({ hasAccess: true });
  }
  
  return NextResponse.json({ hasAccess: false });
}



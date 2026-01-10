import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
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
}



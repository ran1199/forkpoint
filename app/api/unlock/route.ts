// Checks the shared password and, if right, sets the httpOnly cookie (D10).
// No maxAge: it's a session cookie, gone when the browser closes.

import { NextResponse } from "next/server";
import { passwordIsSet, tokenForPassword, UNLOCK_COOKIE } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!passwordIsSet()) {
    return NextResponse.json({ error: "The live version has no password set yet." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const token = typeof body?.password === "string" ? tokenForPassword(body.password) : null;
  if (!token) return NextResponse.json({ error: "That password isn't right." }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(UNLOCK_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}

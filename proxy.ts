// Runs on the server before the live pages and AI routes (D10).
// Live pages without the password cookie go to the password page;
// AI routes without it are refused.

import { NextResponse, type NextRequest } from "next/server";
import { isUnlocked, UNLOCK_COOKIE } from "@/lib/server/auth";

export function proxy(request: NextRequest) {
  if (isUnlocked(request.cookies.get(UNLOCK_COOKIE)?.value)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "The live version is locked. Reload the page and enter the password again." },
      { status: 401 },
    );
  }
  const unlock = new URL("/unlock", request.url);
  unlock.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(unlock);
}

export const config = {
  matcher: ["/app", "/app/:path*", "/api/forks", "/api/options", "/api/prompt"],
};

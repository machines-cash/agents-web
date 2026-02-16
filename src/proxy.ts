import { NextRequest, NextResponse } from "next/server";

const LEGACY_HOST = "agents.machines.cash";
const CANONICAL_ORIGIN = "https://agent.machines.cash";

export function proxy(request: NextRequest) {
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = hostHeader.split(":")[0].toLowerCase();

  if (host === LEGACY_HOST) {
    const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL_ORIGIN);
    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

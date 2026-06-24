import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "veloop_session";

/**
 * Lightweight auth gate: any request to a protected space without a session
 * cookie is bounced to /connexion. Fine-grained role checks happen in the
 * server layouts (requireRole), which can read the data store.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected =
    pathname.startsWith("/app") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/admin");

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/driver/:path*", "/admin/:path*"],
};

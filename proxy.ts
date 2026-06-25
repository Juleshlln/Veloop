import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SESSION_COOKIE = "veloop_session";

function isProtected(pathname: string): boolean {
  return pathname.startsWith("/app") || pathname.startsWith("/driver") || pathname.startsWith("/admin");
}

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/connexion";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * Route gate. With Supabase configured it refreshes the auth session and
 * blocks protected routes for signed-out users. In demo mode it falls back
 * to the cookie gate. Fine-grained role checks happen in the server layouts.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const protectedRoute = isProtected(request.nextUrl.pathname);

  // Demo mode: simple cookie presence check.
  if (!url || !anonKey) {
    if (protectedRoute && !request.cookies.get(SESSION_COOKIE)?.value) {
      return loginRedirect(request);
    }
    return NextResponse.next();
  }

  // Supabase mode: refresh the session and propagate cookies.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (protectedRoute && !user) {
    return loginRedirect(request);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/driver/:path*", "/admin/:path*"],
};

import { middlewareAuth as auth } from '@/lib/auth-edge';
import { NextResponse } from "next/server";

const ADMIN_ONLY_PREFIXES = ["/admin/org-setup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const requiresAuth = pathname.startsWith("/admin");
  if (requiresAuth && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiresAdmin = ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (requiresAdmin && session?.user?.role !== "ADMIN") {
    // NOTE: redirects to "/" for now — your org-setup/page.js server-side
    // guard redirects to "/dashboard", which doesn't exist yet. Both should
    // point at the same place once the dashboard is built (Step 9).
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
import { NextRequest, NextResponse } from "next/server";

// Lightweight Edge-compatible middleware
// We just check for the NextAuth session token cookie without importing auth (which requires Node.js)
export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isOnDashboard = pathname.startsWith("/dashboard");
    const isOnAuthPage = pathname === "/login" || pathname === "/register";

    // NextAuth v5 uses "authjs.session-token" or "__Secure-authjs.session-token"
    const sessionToken =
        req.cookies.get("authjs.session-token")?.value ||
        req.cookies.get("__Secure-authjs.session-token")?.value;

    const isLoggedIn = !!sessionToken;

    if (isOnDashboard && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    if (isOnAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

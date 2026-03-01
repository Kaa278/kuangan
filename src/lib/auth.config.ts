import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            const isOnAuthPage = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
            const isRoot = nextUrl.pathname === "/";

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            if (isLoggedIn && (isOnAuthPage || isRoot)) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }

            if (!isLoggedIn && isRoot) {
                return Response.redirect(new URL("/login", nextUrl));
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;

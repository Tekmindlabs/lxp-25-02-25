import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { DefaultJWT } from "next-auth/jwt";
import { DefaultRoles } from "@/utils/permissions";

interface CustomJWT extends DefaultJWT {
  roles: string[];
  permissions: string[];
}

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req }) as CustomJWT | null;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard');
    const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
    const isTrpcRoute = req.nextUrl.pathname.startsWith('/api/trpc');
    const isPublicRoute = 
      req.nextUrl.pathname === '/' || 
      req.nextUrl.pathname.startsWith('/_next') ||
      isTrpcRoute ||
      isApiAuthRoute;

    console.log('Middleware - Session Details:', {
      path: req.nextUrl.pathname,
      isAuth,
      token: {
        id: token?.id,
        roles: token?.roles,
        permissions: token?.permissions,
        email: token?.email,
      },
      isTrpcRoute,
    });

    // Always allow TRPC routes
    if (isTrpcRoute) {
      return NextResponse.next();
    }

    // Allow all public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Check role-based access for dashboard routes
    if (isDashboardPage && isAuth) {
      const pathParts = req.nextUrl.pathname.split('/');
      const urlRole = pathParts[2];
      const userRole = token.roles?.[0]?.toLowerCase();
      
      // If no role is assigned, default to student
      if (!userRole) {
        return NextResponse.redirect(new URL(`/dashboard/${DefaultRoles.STUDENT.toLowerCase()}`, req.url));
      }

      // Special handling for campus routes
      if (pathParts[2] === 'campus') {
        return NextResponse.redirect(new URL(`/dashboard/${userRole}/campus${req.nextUrl.pathname.substring('/dashboard/campus'.length)}`, req.url));
      }

      // Validate if urlRole is a valid role
      const validRoles = Object.values(DefaultRoles).map(role => role.toLowerCase());
      const isValidRole = validRoles.includes(urlRole);
      
      // If accessing a role-specific route that doesn't match user's role or is invalid
      if (urlRole && (urlRole !== userRole || !isValidRole)) {
        return NextResponse.redirect(new URL(`/dashboard/${userRole}`, req.url));
      }
      
      // If accessing /dashboard directly, redirect to role-specific dashboard
      if (req.nextUrl.pathname === '/dashboard') {
        return NextResponse.redirect(new URL(`/dashboard/${userRole}`, req.url));
      }
    }

    // Redirect authenticated users away from auth pages
    if (isAuth && isAuthPage) {
      const role = token.roles?.[0] || DefaultRoles.STUDENT;
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }

    // Redirect unauthenticated users to sign in
    if (!isAuth && isDashboardPage) {
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url)
      );
    }

    // Allow access to auth pages for unauthenticated users
    if (!isAuth && isAuthPage) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
        const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
        const isTrpcRoute = req.nextUrl.pathname.startsWith('/api/trpc');
        const isPublicRoute = 
          req.nextUrl.pathname === '/' || 
          req.nextUrl.pathname.startsWith('/_next') ||
          isTrpcRoute ||
          isApiAuthRoute;

        return !!token || isAuthPage || isPublicRoute;
      }
    }
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
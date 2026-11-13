import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Skip static assets, internal Next.js requests, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // files with extensions (e.g. images, favicon, robots.txt, sitemap.xml)
  ) {
    return NextResponse.next();
  }

  // 2. Canonical URL normalization: Duplicate consecutive slashes (e.g., //properties -> /properties)
  if (pathname.includes('//')) {
    const cleanPath = pathname.replace(/\/+/g, '/');
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    return NextResponse.redirect(url, 308);
  }

  // 3. Canonical URL normalization: Lowercase route paths (except query params)
  const lowercased = pathname.toLowerCase();
  if (pathname !== lowercased) {
    const url = request.nextUrl.clone();
    url.pathname = lowercased;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml)).*)',
  ],
};

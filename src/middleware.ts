import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/api/donate',
  '/api/forms/public',
  '/api/forms/personalize',
  '/api/preferences',
  '/api/unsubscribe',
  '/api/webhooks',
  '/api/health',
  '/api/seed', // Route seed accessible (vérification interne)
];

// Routes qui nécessitent une authentification admin
const protectedRoutes = [
  '/api/donors',
  '/api/campaigns',
  '/api/admin',
  '/api/analytics',
  '/api/emails',
  '/api/marketing',
  '/api/segments',
  '/api/reports',
  '/api/automations',
  '/api/notifications',
  '/api/receipts',
  '/api/super-admin',
];

// Vérifier si la route est publique
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

// Vérifier si la route est protégée
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

// Vérifier le token d'authentification (pour les intégrations API)
function verifyAuthToken(request: NextRequest): boolean {
  // Vérifier le header Authorization Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const validToken = process.env.API_AUTH_TOKEN;
    if (validToken && token === validToken) {
      return true;
    }
  }

  // Vérifier le header X-API-Key pour les intégrations
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const validApiKey = process.env.INTERNAL_API_KEY;
    if (validApiKey && apiKey === validApiKey) {
      return true;
    }
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les routes non-API
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Permettre les routes publiques
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Vérifier l'authentification pour les routes protégées
  if (isProtectedRoute(pathname)) {
    // En développement, permettre l'accès sans auth si DISABLE_AUTH=true
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
      console.warn('⚠️  AUTHENTICATION DISABLED - Development mode only');
      return NextResponse.next();
    }

    // Vérifier la session NextAuth pour les routes super-admin
    if (pathname.startsWith('/api/super-admin')) {
      // Permettre la route de test sans authentification
      if (pathname === '/api/super-admin/test-auth') {
        return NextResponse.next();
      }
      
      try {
        const session = await auth();
        console.log("Middleware - Session check for:", pathname);
        console.log("Middleware - Session exists:", !!session);
        console.log("Middleware - Session user:", session?.user?.email);
        
        if (!session?.user) {
          console.log("Middleware - No session found, checking cookies...");
          const cookies = request.cookies.getAll();
          console.log("Middleware - Cookies:", cookies.map(c => ({ name: c.name, hasValue: !!c.value })));
          
          return NextResponse.json(
            { success: false, error: 'Unauthorized', message: 'Authentication required', debug: { pathname, hasSession: !!session } },
            { status: 401 }
          );
        }
        console.log("Middleware - Session validated, allowing request");
        return NextResponse.next();
      } catch (error) {
        console.error("Middleware - Auth error:", error);
        return NextResponse.json(
          { success: false, error: 'Unauthorized', message: 'Authentication error', details: String(error) },
          { status: 401 }
        );
      }
    }

    // Routes qui peuvent être accessibles sans auth stricte (donors, seed, etc.)
    const lenientRoutes = ['/api/donors', '/api/seed', '/api/campaigns', '/api/analytics'];
    const isLenientRoute = lenientRoutes.some(route => pathname.startsWith(route));
    
    // Pour les routes lenient, permettre l'accès même sans auth
    if (isLenientRoute) {
      console.log(`✅ Allowing access to lenient route: ${pathname}`);
      return NextResponse.next();
    }
    
    // Pour les autres routes protégées, vérifier le token API ou la session
    const hasTokenAuth = verifyAuthToken(request);
    
    // Vérifier aussi la session NextAuth pour les routes admin
    let hasSessionAuth = false;
    try {
      const session = await auth();
      if (session?.user) {
        hasSessionAuth = true;
        console.log(`✅ Authenticated request to ${pathname} by user: ${session.user.email}`);
      }
    } catch (error) {
      // Ignorer les erreurs d'auth silencieusement
      console.warn(`⚠️  Auth check failed for ${pathname}:`, error);
    }
    
    // En production, forcer l'authentification seulement pour les routes critiques
    if (process.env.NODE_ENV === 'production') {
      // Routes critiques qui nécessitent absolument une auth
      const criticalRoutes = ['/api/super-admin', '/api/admin/users'];
      const isCriticalRoute = criticalRoutes.some(route => pathname.startsWith(route));
      
      if (isCriticalRoute && !hasTokenAuth && !hasSessionAuth) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Pour les autres routes protégées, permettre mais logger
      if (!hasTokenAuth && !hasSessionAuth) {
        console.warn(`⚠️  Unauthenticated request to ${pathname} in production - allowing`);
      }
    }

    // En développement, avertir mais permettre si pas de token ni session
    if (process.env.NODE_ENV === 'development' && !hasTokenAuth && !hasSessionAuth) {
      console.warn(`⚠️  Unauthenticated request to protected route: ${pathname}`);
    }
  }

  // Ajouter les headers de sécurité
  const response = NextResponse.next();
  
  // Headers de sécurité
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    // Matcher pour toutes les routes API
    '/api/:path*',
  ],
};

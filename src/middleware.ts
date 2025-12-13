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
  '/api/seed', // Route seed accessible avec token
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
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Pour les autres routes protégées, vérifier le token API ou la session
    const hasTokenAuth = verifyAuthToken(request);
    
    // Vérifier aussi la session NextAuth pour les routes admin/donors/etc
    let hasSessionAuth = false;
    try {
      const session = await auth();
      hasSessionAuth = !!session?.user;
    } catch (error) {
      // Ignorer les erreurs d'auth silencieusement
    }
    
    // En production, forcer l'authentification (token API ou session)
    if (process.env.NODE_ENV === 'production' && !hasTokenAuth && !hasSessionAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
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

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/api/donate',
  '/api/forms/public',
  '/api/forms/personalize',
  '/api/preferences',
  '/api/unsubscribe',
  '/api/webhooks',
  '/api/health',
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
];

// Vérifier si la route est publique
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

// Vérifier si la route est protégée
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

// Vérifier le token d'authentification
function verifyAuthToken(request: NextRequest): boolean {
  // Vérifier le header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Pour l'instant, accepter un token simple basé sur une variable d'environnement
    const validToken = process.env.API_AUTH_TOKEN;
    if (validToken && token === validToken) {
      return true;
    }
  }

  // Vérifier le cookie de session
  const sessionCookie = request.cookies.get('admin_session');
  if (sessionCookie?.value) {
    // Valider le cookie de session
    try {
      // Simple validation - en production, utiliser JWT ou une autre méthode sécurisée
      const sessionData = JSON.parse(atob(sessionCookie.value));
      if (sessionData.authenticated && sessionData.expiresAt > Date.now()) {
        return true;
      }
    } catch {
      // Cookie invalide
      return false;
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

export function middleware(request: NextRequest) {
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
    // TEMPORAIRE: Désactiver l'authentification jusqu'à ce qu'un système de login soit implémenté
    // TODO: Implémenter un vrai système d'authentification (NextAuth, etc.)
    return NextResponse.next();
    
    // Code d'authentification commenté pour référence future:
    // if (process.env.NODE_ENV === 'development') {
    //   return NextResponse.next();
    // }
    // if (!verifyAuthToken(request)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized', message: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }
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

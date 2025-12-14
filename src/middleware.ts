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

  // Routes publiques API (doivent être vérifiées AVANT les pages)
  const publicApiRoutes = [
    '/api/auth', // Routes NextAuth doivent être publiques - CRITIQUE
  ];

  // Routes publiques pages
  const publicPageRoutes = [
    '/login',
    '/login/accept',
    '/super-admin/login',
    '/super-admin/invite/accept',
    '/donate',
    '/donate/', // Routes de donation publiques
    '/fundraise/', // Routes de fundraising publiques
    '/preferences/', // Préférences de communication
    '/unsubscribe', // Désabonnement
  ];

  // Vérifier d'abord les routes API - TOUTES les routes API passent
  // Le middleware ne bloque JAMAIS les routes API, elles gèrent leur propre auth
  if (pathname.startsWith('/api')) {
    // Permettre explicitement /api/auth (NextAuth)
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }
    
    // Pour TOUTES les autres routes API, laisser passer
    // La route API elle-même gère l'authentification et retourne du JSON
    return NextResponse.next();
  }

  // Vérifier si c'est une route publique (page)
  const isPublicPage = publicPageRoutes.some(route => {
    if (route === pathname) return true;
    if (route.endsWith('/') && pathname.startsWith(route)) return true;
    return false;
  });

  // Si c'est une route publique, permettre l'accès
  if (isPublicPage) {
    return NextResponse.next();
  }

  // Routes protégées (pages qui nécessitent une authentification)
  const protectedPageRoutes = [
    '/', // Dashboard principal
    '/dashboard',
    '/donors',
    '/campaigns',
    '/forms',
    '/analytics',
    '/automations',
    '/reports',
    '/segments',
    '/organizations',
    '/settings',
    '/admin',
    '/marketing',
    '/p2p',
    '/copilot',
    '/super-admin',
  ];

  // Vérifier si c'est une page protégée
  const isProtectedPage = protectedPageRoutes.some(route => pathname.startsWith(route));

  if (isProtectedPage) {
    // Vérifier l'authentification
    try {
      const session = await auth();
      if (!session?.user) {
        // Rediriger vers la page de login appropriée
        const loginUrl = pathname.startsWith('/super-admin') 
          ? '/super-admin/login'
          : '/login';
        const url = request.nextUrl.clone();
        url.pathname = loginUrl;
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error(`[MIDDLEWARE] Auth check failed for ${pathname}:`, error);
      // En cas d'erreur, rediriger vers login pour sécurité
      const loginUrl = pathname.startsWith('/super-admin') 
        ? '/super-admin/login'
        : '/login';
      const url = request.nextUrl.clone();
      url.pathname = loginUrl;
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
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
    // Matcher pour toutes les routes API et pages protégées
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

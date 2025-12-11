/**
 * Simple in-memory rate limiter
 * Pour une solution plus robuste en production, utiliser Redis (ex: @upstash/ratelimit)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Nettoyer les entrées expirées toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Nombre maximum de requêtes autorisées */
  maxRequests: number;
  /** Fenêtre de temps en secondes */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Vérifie si une requête est autorisée selon le rate limit
 * @param identifier - Identifiant unique (IP, userId, etc.)
 * @param config - Configuration du rate limit
 * @returns Résultat du rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // Si pas d'entrée ou fenêtre expirée, créer une nouvelle entrée
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Incrémenter le compteur
  entry.count++;

  // Vérifier si la limite est atteinte
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Obtenir l'IP du client depuis les headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

/**
 * Configurations prédéfinies pour différents types d'endpoints
 */
export const RATE_LIMITS = {
  // API générale - 100 requêtes par minute
  default: { maxRequests: 100, windowSeconds: 60 },
  
  // API d'authentification - 10 tentatives par minute
  auth: { maxRequests: 10, windowSeconds: 60 },
  
  // API d'envoi d'emails - 20 par minute
  email: { maxRequests: 20, windowSeconds: 60 },
  
  // API de génération IA - 30 par minute
  ai: { maxRequests: 30, windowSeconds: 60 },
  
  // API d'import - 5 par minute
  import: { maxRequests: 5, windowSeconds: 60 },
  
  // API de seed (très restrictif) - 1 par heure
  seed: { maxRequests: 1, windowSeconds: 3600 },
};

/**
 * Middleware helper pour appliquer le rate limiting dans une route API
 */
export function withRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.default
): { allowed: boolean; headers: Record<string, string> } {
  const ip = getClientIP(request);
  const result = checkRateLimit(ip, config);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
  };

  if (!result.success) {
    headers["Retry-After"] = String(Math.ceil((result.resetTime - Date.now()) / 1000));
  }

  return {
    allowed: result.success,
    headers,
  };
}

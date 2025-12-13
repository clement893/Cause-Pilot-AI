import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";

// Get CSRF secret with strict validation
function getCSRFSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("CSRF_SECRET or JWT_SECRET environment variable is required");
  }
  return secret;
}
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Génère un token CSRF sécurisé
 */
export function generateCSRFToken(): string {
  const CSRF_SECRET = getCSRFSecret();
  const timestamp = Date.now().toString();
  const random = randomBytes(16).toString("hex");
  const data = `${timestamp}:${random}`;
  const signature = createHmac("sha256", CSRF_SECRET)
    .update(data)
    .digest("hex");
  return `${data}:${signature}`;
}

/**
 * Vérifie la validité d'un token CSRF
 */
export function verifyCSRFToken(token: string): boolean {
  if (!token) return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [timestamp, random, signature] = parts;
  
  // Vérifier l'expiration
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime) || Date.now() - tokenTime > TOKEN_EXPIRY) {
    return false;
  }

  // Vérifier la signature
  const CSRF_SECRET = getCSRFSecret();
  const data = `${timestamp}:${random}`;
  const expectedSignature = createHmac("sha256", CSRF_SECRET)
    .update(data)
    .digest("hex");

  return signature === expectedSignature;
}

/**
 * Définit le cookie CSRF
 */
export async function setCSRFCookie(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TOKEN_EXPIRY / 1000,
    path: "/",
  });

  return token;
}

/**
 * Récupère le token CSRF depuis le cookie
 */
export async function getCSRFTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Vérifie la protection CSRF pour une requête
 * Compare le token du header avec celui du cookie
 */
export async function validateCSRFRequest(request: Request): Promise<boolean> {
  // Les requêtes GET, HEAD, OPTIONS ne nécessitent pas de vérification CSRF
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  // Récupérer le token du header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return false;
  }

  // Récupérer le token du cookie
  const cookieToken = await getCSRFTokenFromCookie();
  if (!cookieToken) {
    return false;
  }

  // Vérifier que les tokens correspondent et sont valides
  if (headerToken !== cookieToken) {
    return false;
  }

  return verifyCSRFToken(headerToken);
}

/**
 * Middleware helper pour la protection CSRF
 */
export async function withCSRFProtection(
  request: Request
): Promise<{ valid: boolean; error?: string }> {
  const isValid = await validateCSRFRequest(request);
  
  if (!isValid) {
    return {
      valid: false,
      error: "Invalid or missing CSRF token",
    };
  }

  return { valid: true };
}

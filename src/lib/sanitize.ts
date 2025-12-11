/**
 * Utilitaires de sanitization HTML
 * Version simplifiée sans dépendance externe pour éviter les problèmes de build SSR
 */

// Liste des balises HTML autorisées
const ALLOWED_TAGS = new Set([
  "a", "b", "br", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
  "i", "li", "ol", "p", "span", "strong", "u", "ul", "table", "thead",
  "tbody", "tr", "th", "td", "img", "blockquote", "code", "pre", "hr"
]);

// Liste des attributs autorisés
const ALLOWED_ATTRS = new Set([
  "href", "title", "alt", "src", "class", "id", "style", "target",
  "rel", "width", "height", "colspan", "rowspan"
]);

// Balises interdites (à supprimer complètement avec leur contenu)
const FORBIDDEN_TAGS = new Set([
  "script", "style", "iframe", "form", "input", "button", "object", "embed"
]);

// Attributs interdits (événements JavaScript)
const FORBIDDEN_ATTRS = new Set([
  "onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur",
  "onmouseout", "onmousedown", "onmouseup", "onkeydown", "onkeyup", "onkeypress"
]);

/**
 * Échappe les caractères HTML spéciaux
 */
export function escapeHTML(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize du HTML - version simplifiée
 * Retire les balises et attributs dangereux
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return "";
  
  // Supprimer les balises script et style avec leur contenu
  let clean = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "");
  
  // Supprimer les attributs d'événements JavaScript
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");
  
  // Supprimer les URLs javascript:
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');
  
  // Supprimer les URLs data: (sauf images)
  clean = clean.replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, 'src=""');
  
  return clean;
}

/**
 * Sanitize stricte - retire tout le HTML, garde uniquement le texte
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return "";
  // Supprimer toutes les balises HTML
  return dirty.replace(/<[^>]*>/g, "").trim();
}

/**
 * Sanitize pour les contenus email
 */
export function sanitizeEmailHTML(dirty: string): string {
  if (!dirty) return "";
  // Même logique que sanitizeHTML pour les emails
  return sanitizeHTML(dirty);
}

/**
 * Valide et nettoie une URL
 * Prévient les attaques javascript: et data:
 */
export function sanitizeURL(url: string): string {
  if (!url) return "";
  
  const trimmed = url.trim().toLowerCase();
  
  // Bloquer les protocoles dangereux
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:")
  ) {
    return "";
  }
  
  // Autoriser uniquement http, https, mailto, tel
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#")
  ) {
    return url.trim();
  }
  
  // Si pas de protocole, ajouter https://
  if (!trimmed.includes("://")) {
    return `https://${url.trim()}`;
  }
  
  return "";
}

/**
 * Nettoie un objet en sanitisant toutes les valeurs string
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  
  for (const key in result) {
    const value = result[key];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeText(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    }
  }
  
  return result;
}

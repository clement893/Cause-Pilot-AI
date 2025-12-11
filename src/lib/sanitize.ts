import DOMPurify from "isomorphic-dompurify";

// Type pour la configuration DOMPurify
type DOMPurifyConfig = {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOW_DATA_ATTR?: boolean;
  FORBID_TAGS?: string[];
  FORBID_ATTR?: string[];
};

/**
 * Configuration par défaut pour DOMPurify
 * Permet uniquement les balises et attributs HTML sûrs
 */
const DEFAULT_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    "a", "b", "br", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
    "i", "li", "ol", "p", "span", "strong", "u", "ul", "table", "thead",
    "tbody", "tr", "th", "td", "img", "blockquote", "code", "pre", "hr"
  ],
  ALLOWED_ATTR: [
    "href", "title", "alt", "src", "class", "id", "style", "target",
    "rel", "width", "height", "colspan", "rowspan"
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ["script", "style", "iframe", "form", "input", "button", "object", "embed"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
};

/**
 * Configuration stricte - texte uniquement
 */
const STRICT_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
};

/**
 * Configuration pour les emails - HTML limité
 */
const EMAIL_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    "a", "b", "br", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
    "i", "li", "ol", "p", "span", "strong", "u", "ul", "table", "thead",
    "tbody", "tr", "th", "td", "img", "blockquote", "hr"
  ],
  ALLOWED_ATTR: [
    "href", "title", "alt", "src", "style", "width", "height",
    "colspan", "rowspan", "align", "valign", "bgcolor", "border"
  ],
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize du HTML avec la configuration par défaut
 * @param dirty - HTML potentiellement dangereux
 * @returns HTML nettoyé
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, DEFAULT_CONFIG);
}

/**
 * Sanitize stricte - retire tout le HTML, garde uniquement le texte
 * @param dirty - Texte potentiellement contenant du HTML
 * @returns Texte pur sans HTML
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, STRICT_CONFIG);
}

/**
 * Sanitize pour les contenus email
 * @param dirty - HTML pour email
 * @returns HTML nettoyé pour email
 */
export function sanitizeEmailHTML(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, EMAIL_CONFIG);
}

/**
 * Échappe les caractères HTML spéciaux
 * Utile pour afficher du texte brut dans un contexte HTML
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

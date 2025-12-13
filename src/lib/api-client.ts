/**
 * Helpers pour les appels API avec support multi-organisation
 */

/**
 * Crée une URL avec le paramètre organizationId si disponible
 */
export function addOrganizationParam(url: string, organizationId: string | null | undefined): string {
  if (!organizationId) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}organizationId=${encodeURIComponent(organizationId)}`;
}

/**
 * Crée des headers avec l'organizationId si disponible
 */
export function createApiHeaders(organizationId: string | null | undefined): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (organizationId) {
    headers['X-Organization-Id'] = organizationId;
  }
  
  return headers;
}

/**
 * Wrapper pour fetch avec support automatique de l'organisation
 */
export async function apiFetch(
  url: string,
  options: RequestInit & { organizationId?: string | null } = {}
): Promise<Response> {
  const { organizationId, ...fetchOptions } = options;
  
  const finalUrl = addOrganizationParam(url, organizationId);
  const headers = {
    ...createApiHeaders(organizationId),
    ...fetchOptions.headers,
  };
  
  return fetch(finalUrl, {
    ...fetchOptions,
    headers,
  });
}

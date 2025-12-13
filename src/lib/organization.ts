/**
 * Helpers pour gérer l'organisation courante dans les routes API
 */

import { NextRequest } from "next/server";
import { prisma } from "./prisma";

/**
 * Récupère l'ID de l'organisation depuis les headers ou query params
 * Priorité: header X-Organization-Id > query param organizationId
 */
export function getOrganizationId(request: NextRequest): string | null {
  // Vérifier le header personnalisé
  const headerOrgId = request.headers.get("x-organization-id");
  if (headerOrgId) {
    return headerOrgId;
  }

  // Vérifier le query param
  const queryOrgId = request.nextUrl.searchParams.get("organizationId");
  if (queryOrgId) {
    return queryOrgId;
  }

  return null;
}

/**
 * Récupère l'organisation depuis la session utilisateur ou les headers
 * Pour l'instant, on utilise les headers/query params
 * TODO: Implémenter la récupération depuis la session utilisateur
 */
export async function getCurrentOrganization(
  request: NextRequest
): Promise<{ id: string; name: string } | null> {
  const organizationId = getOrganizationId(request);
  
  if (!organizationId) {
    return null;
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    return organization;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
}

/**
 * Ajoute le filtre d'organisation à une requête Prisma WhereInput
 */
export function addOrganizationFilter<T extends Record<string, unknown>>(
  where: T,
  organizationId: string | null
): T {
  if (organizationId) {
    return {
      ...where,
      organizationId,
    } as T;
  }
  return where;
}

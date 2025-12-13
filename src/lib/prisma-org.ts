/**
 * Helper pour obtenir l'instance Prisma appropriée selon l'organisation
 * Utilise le système multi-bases si configuré, sinon utilise l'instance par défaut
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import { getPrismaForOrganization, defaultPrisma } from "./prisma-multi";
import { getOrganizationId } from "./organization";

/**
 * Obtient l'instance Prisma appropriée pour une requête
 * Si l'organisation a une base dédiée, l'utilise
 * Sinon, utilise l'instance par défaut (mode partagé)
 */
export async function getPrisma(request?: NextRequest): Promise<PrismaClient> {
  // Si pas de requête, utiliser l'instance par défaut
  if (!request) {
    return prisma;
  }

  // Récupérer l'ID de l'organisation
  const organizationId = getOrganizationId(request);

  // Si pas d'organisation spécifiée, utiliser l'instance par défaut
  if (!organizationId) {
    return prisma;
  }

  // Vérifier si on doit utiliser le système multi-bases
  // Par défaut, on utilise le système multi-bases si activé
  const useMultiDatabase = process.env.ENABLE_MULTI_DATABASE === "true";

  if (useMultiDatabase) {
    try {
      return await getPrismaForOrganization(organizationId);
    } catch (error) {
      console.error(`Error getting Prisma for organization ${organizationId}:`, error);
      // Fallback vers l'instance par défaut en cas d'erreur
      return prisma;
    }
  }

  // Mode partagé : utiliser l'instance par défaut avec filtrage par organizationId
  return prisma;
}

/**
 * Obtient l'instance Prisma pour la base principale (métadonnées)
 * Toujours utiliser cette instance pour les requêtes sur Organization, User, etc.
 */
export function getMainPrisma(): PrismaClient {
  return defaultPrisma;
}

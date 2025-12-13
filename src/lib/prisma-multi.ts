/**
 * Gestionnaire de connexions Prisma multiples pour isolation par organisation
 * Permet d'avoir une base de données séparée par organisation pour une sécurité maximale
 */

import { PrismaClient } from "@prisma/client";

// Cache des instances Prisma par organisation
const prismaClients = new Map<string, PrismaClient>();

// Instance par défaut (pour la base principale qui contient les organisations)
const globalForPrisma = globalThis as unknown as {
  defaultPrisma: PrismaClient | undefined;
};

// Instance Prisma pour la base principale (métadonnées des organisations)
export const defaultPrisma =
  globalForPrisma.defaultPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.defaultPrisma = defaultPrisma;
}

/**
 * Récupère l'URL de la base de données pour une organisation
 * Si l'organisation a une databaseUrl configurée, l'utilise
 * Sinon, utilise la DATABASE_URL par défaut (mode partagé)
 */
async function getOrganizationDatabaseUrl(organizationId: string): Promise<string> {
  try {
    const organization = await defaultPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { databaseUrl: true },
    });

    // Si l'organisation a sa propre base de données
    if (organization?.databaseUrl) {
      return organization.databaseUrl;
    }

    // Sinon, utiliser la base par défaut (mode partagé)
    return process.env.DATABASE_URL || "";
  } catch (error) {
    console.error(`Error fetching database URL for organization ${organizationId}:`, error);
    // Fallback vers la base par défaut
    return process.env.DATABASE_URL || "";
  }
}

/**
 * Obtient ou crée une instance PrismaClient pour une organisation spécifique
 */
export async function getPrismaForOrganization(
  organizationId: string | null
): Promise<PrismaClient> {
  // Si pas d'organisation, utiliser l'instance par défaut
  if (!organizationId) {
    return defaultPrisma;
  }

  // Vérifier si on a déjà une instance en cache
  if (prismaClients.has(organizationId)) {
    return prismaClients.get(organizationId)!;
  }

  // Récupérer l'URL de la base pour cette organisation
  const databaseUrl = await getOrganizationDatabaseUrl(organizationId);

  // Si c'est la même URL que la base par défaut, réutiliser l'instance
  if (databaseUrl === process.env.DATABASE_URL) {
    prismaClients.set(organizationId, defaultPrisma);
    return defaultPrisma;
  }

  // Créer une nouvelle instance PrismaClient pour cette organisation
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Mettre en cache
  prismaClients.set(organizationId, prisma);

  return prisma;
}

/**
 * Nettoie les connexions Prisma (utile pour les tests ou le redémarrage)
 */
export async function disconnectAllPrismaClients(): Promise<void> {
  await Promise.all(
    Array.from(prismaClients.values()).map((client) => client.$disconnect())
  );
  await defaultPrisma.$disconnect();
  prismaClients.clear();
}

/**
 * Vérifie si une organisation utilise une base de données dédiée
 */
export async function hasDedicatedDatabase(organizationId: string): Promise<boolean> {
  try {
    const organization = await defaultPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { databaseUrl: true },
    });
    return !!organization?.databaseUrl;
  } catch {
    return false;
  }
}

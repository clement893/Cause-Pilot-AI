/**
 * Gestionnaire de connexions Prisma multiples pour isolation par organisation
 * Permet d'avoir une base de donnÃ©es sÃ©parÃ©e par organisation pour une sÃ©curitÃ© maximale
 */

import { PrismaClient } from "@prisma/client";

// Cache des instances Prisma par organisation
const prismaClients = new Map<string, PrismaClient>();

// Instance par dÃ©faut (pour la base principale qui contient les organisations)
const globalForPrisma = globalThis as unknown as {
  defaultPrisma: PrismaClient | undefined;
};

/**
 * Obtient ou crÃ©e l'instance Prisma par dÃ©faut
 * Utilise une initialisation lazy pour Ã©viter les erreurs pendant le build
 */
function getDefaultPrismaInstance(): PrismaClient {
  // Si dÃ©jÃ  initialisÃ© dans le global, le rÃ©utiliser
  if (globalForPrisma.defaultPrisma) {
    return globalForPrisma.defaultPrisma;
  }

  // VÃ©rifier que DATABASE_URL est disponible
  // Pendant le build, utiliser une URL factice (la route est dynamique donc ne s'exÃ©cutera pas)
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder@localhost:5432/placeholder';

  // CrÃ©er l'instance Prisma
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Mettre en cache dans le global pour le dÃ©veloppement
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.defaultPrisma = prisma;
  }

  return prisma;
}

// Instance Prisma pour la base principale (mÃ©tadonnÃ©es des organisations)
// Utilise une fonction pour une initialisation lazy
export const defaultPrisma = getDefaultPrismaInstance();

/**
 * RÃ©cupÃ¨re l'URL de la base de donnÃ©es pour une organisation
 * Si l'organisation a une databaseUrl configurÃ©e, l'utilise
 * Sinon, utilise la DATABASE_URL par dÃ©faut (mode partagÃ©)
 */
async function getOrganizationDatabaseUrl(organizationId: string): Promise<string> {
  try {
    const organization = await defaultPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { databaseUrl: true },
    });

    // Si l'organisation a sa propre base de donnÃ©es
    if (organization?.databaseUrl) {
      return organization.databaseUrl;
    }

    // Sinon, utiliser la base par dÃ©faut (mode partagÃ©)
    return process.env.DATABASE_URL || "";
  } catch (error) {
    console.error(`Error fetching database URL for organization ${organizationId}:`, error);
    // Fallback vers la base par dÃ©faut
    return process.env.DATABASE_URL || "";
  }
}

/**
 * Obtient ou crÃ©e une instance PrismaClient pour une organisation spÃ©cifique
 */
export async function getPrismaForOrganization(
  organizationId: string | null
): Promise<PrismaClient> {
  // Si pas d'organisation, utiliser l'instance par dÃ©faut
  if (!organizationId) {
    return defaultPrisma;
  }

  // VÃ©rifier si on a dÃ©jÃ  une instance en cache
  if (prismaClients.has(organizationId)) {
    return prismaClients.get(organizationId)!;
  }

  // RÃ©cupÃ©rer l'URL de la base pour cette organisation
  const databaseUrl = await getOrganizationDatabaseUrl(organizationId);

  // Si c'est la mÃªme URL que la base par dÃ©faut, rÃ©utiliser l'instance
  if (databaseUrl === process.env.DATABASE_URL) {
    prismaClients.set(organizationId, defaultPrisma);
    return defaultPrisma;
  }

  // CrÃ©er une nouvelle instance PrismaClient pour cette organisation
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
 * Nettoie les connexions Prisma (utile pour les tests ou le redÃ©marrage)
 */
export async function disconnectAllPrismaClients(): Promise<void> {
  await Promise.all(
    Array.from(prismaClients.values()).map((client) => client.$disconnect())
  );
  await defaultPrisma.$disconnect();
  prismaClients.clear();
}

/**
 * VÃ©rifie si une organisation utilise une base de donnÃ©es dÃ©diÃ©e
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
/**
 * Gestionnaire de connexions Prisma multiples pour isolation par organisation
 * Permet d'avoir une base de donnÃƒÆ’Ã‚Â©es sÃƒÆ’Ã‚Â©parÃƒÆ’Ã‚Â©e par organisation pour une sÃƒÆ’Ã‚Â©curitÃƒÆ’Ã‚Â© maximale
 */

import { PrismaClient } from "@prisma/client";

// Cache des instances Prisma par organisation
const prismaClients = new Map<string, PrismaClient>();

// Instance par dÃƒÆ’Ã‚Â©faut (pour la base principale qui contient les organisations)
const globalForPrisma = globalThis as unknown as {
  defaultPrisma: PrismaClient | undefined;
};

/**
 * Obtient ou crÃƒÆ’Ã‚Â©e l'instance Prisma par dÃƒÆ’Ã‚Â©faut
 * Utilise une initialisation lazy pour ÃƒÆ’Ã‚Â©viter les erreurs pendant le build
 */
function getDefaultPrismaInstance(): PrismaClient {
  // Si dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  initialisÃƒÆ’Ã‚Â© dans le global, le rÃƒÆ’Ã‚Â©utiliser
  if (globalForPrisma.defaultPrisma) {
    return globalForPrisma.defaultPrisma;
  }

  // VÃƒÆ’Ã‚Â©rifier que DATABASE_URL est disponible
  // Pendant le build, utiliser une URL factice (la route est dynamique donc ne s'exÃƒÆ’Ã‚Â©cutera pas)
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder@localhost:5432/placeholder';

  // CrÃƒÆ’Ã‚Â©er l'instance Prisma
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Mettre en cache dans le global pour le dÃƒÆ’Ã‚Â©veloppement
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.defaultPrisma = prisma;
  }

  return prisma;
}

// Instance Prisma pour la base principale (mÃƒÆ’Ã‚Â©tadonnÃƒÆ’Ã‚Â©es des organisations)
// Utilise une fonction pour une initialisation lazy
export const defaultPrisma = getDefaultPrismaInstance();
/**
 * Gestionnaire de connexions Prisma multiples pour isolation par organisation
 * Permet d'avoir une base de donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©parÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e par organisation pour une sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©curitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© maximale
 */

import { PrismaClient } from "@prisma/client";

// Cache des instances Prisma par organisation
const prismaClients = new Map<string, PrismaClient>();

// Instance par dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©faut (pour la base principale qui contient les organisations)
const globalForPrisma = globalThis as unknown as {
  defaultPrisma: PrismaClient | undefined;
};

/**
 * Obtient ou crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e l'instance Prisma par dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©faut
 * Utilise une initialisation lazy pour ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©viter les erreurs pendant le build
 */
function getDefaultPrismaInstance(): PrismaClient {
  // Si dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© dans le global, le rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©utiliser
  if (globalForPrisma.defaultPrisma) {
    return globalForPrisma.defaultPrisma;
  }

  // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier que DATABASE_URL est disponible
  // Pendant le build, utiliser une URL factice (la route est dynamique donc ne s'exÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cutera pas)
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder@localhost:5432/placeholder';

  // CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er l'instance Prisma
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Mettre en cache dans le global pour le dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©veloppement
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.defaultPrisma = prisma;
  }

  return prisma;
}

// Instance Prisma pour la base principale (mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tadonnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es des organisations)
// Utilise une fonction pour une initialisation lazy
export const defaultPrisma = getDefaultPrismaInstance();
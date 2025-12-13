/**
 * Gestionnaire de connexions Prisma multiples pour isolation par organisation
 * Permet d'\''avoir une base de donnÃƒÂ©es sÃƒÂ©parÃƒÂ©e par organisation pour une sÃƒÂ©curitÃƒÂ© maximale
 */

import { PrismaClient } from "@prisma/client";

// Cache des instances Prisma par organisation
const prismaClients = new Map<string, PrismaClient>();

// Instance par dÃƒÂ©faut (pour la base principale qui contient les organisations)
const globalForPrisma = globalThis as unknown as {
  defaultPrisma: PrismaClient | undefined;
};

/**
 * Obtient ou crÃƒÂ©e l'\''instance Prisma par dÃƒÂ©faut
 * Utilise une initialisation lazy pour ÃƒÂ©viter les erreurs pendant le build
 */
function getDefaultPrismaInstance(): PrismaClient {
  // Si dÃƒÂ©jÃƒÂ  initialisÃƒÂ© dans le global, le rÃƒÂ©utiliser
  if (globalForPrisma.defaultPrisma) {
    return globalForPrisma.defaultPrisma;
  }

  // VÃƒÂ©rifier que DATABASE_URL est disponible
  // Pendant le build, utiliser une URL factice (la route est dynamique donc ne s'\''exÃƒÂ©cutera pas)
  const databaseUrl = process.env.DATABASE_URL || '\''postgresql://placeholder@localhost:5432/placeholder'\'';

  // CrÃƒÂ©er l'\''instance Prisma
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Mettre en cache dans le global pour le dÃƒÂ©veloppement
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.defaultPrisma = prisma;
  }

  return prisma;
}

// Instance Prisma pour la base principale (mÃƒÂ©tadonnÃƒÂ©es des organisations)
// Utilise une fonction pour une initialisation lazy
export const defaultPrisma = getDefaultPrismaInstance();
/**
 * Gestionnaire de connexions Prisma multiples pour isolation par organisation
 * Permet d'\''avoir une base de donnÃ©es sÃ©parÃ©e par organisation pour une sÃ©curitÃ© maximale
 */

import { PrismaClient } from "@prisma/client";

// Cache des instances Prisma par organisation
const prismaClients = new Map<string, PrismaClient>();

// Instance par dÃ©faut (pour la base principale qui contient les organisations)
const globalForPrisma = globalThis as unknown as {
  defaultPrisma: PrismaClient | undefined;
};

/**
 * Obtient ou crÃ©e l'\''instance Prisma par dÃ©faut
 * Utilise une initialisation lazy pour Ã©viter les erreurs pendant le build
 */
function getDefaultPrismaInstance(): PrismaClient {
  // Si dÃ©jÃ  initialisÃ© dans le global, le rÃ©utiliser
  if (globalForPrisma.defaultPrisma) {
    return globalForPrisma.defaultPrisma;
  }

  // VÃ©rifier que DATABASE_URL est disponible
  // Pendant le build, utiliser une URL factice (la route est dynamique donc ne s'\''exÃ©cutera pas)
  const databaseUrl = process.env.DATABASE_URL || '\''postgresql://placeholder@localhost:5432/placeholder'\'';

  // CrÃ©er l'\''instance Prisma
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
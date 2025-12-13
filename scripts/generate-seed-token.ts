#!/usr/bin/env tsx
/**
 * Script pour générer un token sécurisé pour la route seed
 * Usage: npx tsx scripts/generate-seed-token.ts
 */

import { randomBytes } from "crypto";

function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

const token = generateSecureToken(32);

console.log("\n🔐 Token généré pour SEED_SECRET_TOKEN:\n");
console.log(token);
console.log("\n📋 Ajoutez cette variable d'environnement:\n");
console.log(`SEED_SECRET_TOKEN=${token}\n`);
console.log("💡 Pour Railway, ajoutez cette variable dans les paramètres de votre projet.\n");

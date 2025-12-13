// Script pour créer la table AdminInvitation via Prisma db push
// Usage: npx tsx scripts/create-table-now.ts

import { execSync } from 'child_process';

const DATABASE_URL = 'postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway';

console.log('📝 Configuration de la variable DATABASE_URL...');
process.env.DATABASE_URL = DATABASE_URL;

console.log('📝 Exécution de prisma db push...');
try {
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL,
    },
  });
  console.log('✅ Table AdminInvitation créée avec succès!');
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}


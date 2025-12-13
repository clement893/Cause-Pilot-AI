# Guide Pratique : Créer une Base de Données par Organisation

Ce guide vous explique étape par étape comment créer et configurer une base de données séparée pour chaque organisation.

## 📋 Prérequis

- Accès à Railway (ou votre fournisseur de base de données PostgreSQL)
- Accès à la base de données principale actuelle
- Les IDs des organisations existantes

## 🚀 Étape 1 : Créer les Bases de Données sur Railway

### Option A : Via l'Interface Railway

1. **Connectez-vous à Railway** : https://railway.app
2. **Créez un nouveau projet** ou utilisez votre projet existant
3. **Ajoutez une nouvelle base PostgreSQL** pour chaque organisation :
   - Cliquez sur "New" → "Database" → "PostgreSQL"
   - Nommez-la selon l'organisation (ex: `org-1-db`, `org-2-db`)
   - Railway générera automatiquement une URL de connexion

4. **Récupérez les URLs de connexion** :
   - Cliquez sur chaque base de données
   - Allez dans l'onglet "Variables"
   - Copiez la variable `DATABASE_URL` (format: `postgresql://user:pass@host:port/dbname`)

### Option B : Via l'API Railway (si vous avez l'API key)

```bash
# Installer Railway CLI si nécessaire
npm i -g @railway/cli

# Se connecter
railway login

# Créer une nouvelle base PostgreSQL
railway add --database postgresql --name org-1-db

# Récupérer l'URL
railway variables --service org-1-db
```

## 🔧 Étape 2 : Exécuter les Migrations sur Chaque Base

Pour chaque nouvelle base de données créée, vous devez exécuter les migrations Prisma :

```bash
# Pour l'organisation 1
DATABASE_URL="postgresql://user:pass@host:port/org1_db" npx prisma migrate deploy

# Pour l'organisation 2
DATABASE_URL="postgresql://user:pass@host:port/org2_db" npx prisma migrate deploy
```

**Note** : Si vous utilisez Railway, vous pouvez aussi :
1. Créer un service temporaire avec votre code
2. Configurer la variable `DATABASE_URL` pour pointer vers la nouvelle base
3. Exécuter `npx prisma migrate deploy` dans ce service

## 📝 Étape 3 : Configurer les URLs dans la Base Principale

Une fois les bases créées et migrées, vous devez enregistrer les URLs dans la table `Organization` de votre base principale.

### Option A : Via l'API REST

```bash
# Pour l'organisation 1 (remplacez {org-id-1} par l'ID réel)
curl -X PUT https://votre-app.com/api/organizations/{org-id-1}/database \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "databaseUrl": "postgresql://user:pass@host:port/org1_db"
  }'

# Pour l'organisation 2
curl -X PUT https://votre-app.com/api/organizations/{org-id-2}/database \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "databaseUrl": "postgresql://user:pass@host:port/org2_db"
  }'
```

### Option B : Directement en SQL

Connectez-vous à votre base principale et exécutez :

```sql
-- Récupérer les IDs des organisations
SELECT id, name, slug FROM "Organization";

-- Mettre à jour l'organisation 1 (remplacez l'ID et l'URL)
UPDATE "Organization" 
SET "databaseUrl" = 'postgresql://user:pass@host:port/org1_db'
WHERE id = 'votre-org-id-1';

-- Mettre à jour l'organisation 2
UPDATE "Organization" 
SET "databaseUrl" = 'postgresql://user:pass@host:port/org2_db'
WHERE id = 'votre-org-id-2';
```

### Option C : Via un Script Node.js

Créez un fichier `scripts/configure-databases.ts` :

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function configureDatabases() {
  // Récupérer toutes les organisations
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true },
  });

  console.log('Organisations trouvées:');
  organizations.forEach(org => {
    console.log(`- ${org.name} (${org.slug}): ${org.id}`);
  });

  // Configuration manuelle (à adapter selon vos besoins)
  const databaseConfigs: Record<string, string> = {
    'org-id-1': 'postgresql://user:pass@host:port/org1_db',
    'org-id-2': 'postgresql://user:pass@host:port/org2_db',
  };

  for (const [orgId, databaseUrl] of Object.entries(databaseConfigs)) {
    await prisma.organization.update({
      where: { id: orgId },
      data: { databaseUrl },
    });
    console.log(`✅ Base de données configurée pour ${orgId}`);
  }
}

configureDatabases()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Exécutez-le :
```bash
npx tsx scripts/configure-databases.ts
```

## 🔄 Étape 4 : Migrer les Données Existantes (si nécessaire)

Si vous avez déjà des données dans la base principale et que vous voulez les migrer vers les bases dédiées :

### Script de Migration

Créez `scripts/migrate-org-data.ts` :

```typescript
import { PrismaClient } from '@prisma/client';

const mainPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function migrateOrganizationData(organizationId: string, targetDatabaseUrl: string) {
  console.log(`🔄 Migration des données pour l'organisation ${organizationId}...`);

  // Créer un client Prisma pour la base cible
  const targetPrisma = new PrismaClient({
    datasources: { db: { url: targetDatabaseUrl } },
  });

  try {
    // 1. Migrer les donateurs
    const donors = await mainPrisma.donor.findMany({
      where: { organizationId },
      include: {
        DonorPreference: true,
        DonorCustomField: true,
      },
    });

    console.log(`  📋 ${donors.length} donateurs à migrer`);

    for (const donor of donors) {
      const { DonorPreference, DonorCustomField, ...donorData } = donor;
      
      await targetPrisma.donor.create({
        data: {
          ...donorData,
          DonorPreference: DonorPreference ? { create: DonorPreference } : undefined,
          DonorCustomField: {
            create: DonorCustomField.map(field => ({
              value: field.value,
              fieldId: field.fieldId,
            })),
          },
        },
      });
    }

    // 2. Migrer les dons
    const donations = await mainPrisma.donation.findMany({
      where: { 
        Donor: { organizationId } 
      },
    });

    console.log(`  💰 ${donations.length} dons à migrer`);

    for (const donation of donations) {
      await targetPrisma.donation.create({
        data: donation,
      });
    }

    // 3. Migrer les campagnes, formulaires, etc. (adapter selon vos besoins)
    // ...

    console.log(`✅ Migration terminée pour l'organisation ${organizationId}`);
  } finally {
    await targetPrisma.$disconnect();
  }
}

// Utilisation
const organizationId = process.argv[2];
const targetDatabaseUrl = process.argv[3];

if (!organizationId || !targetDatabaseUrl) {
  console.error('Usage: npx tsx scripts/migrate-org-data.ts <org-id> <database-url>');
  process.exit(1);
}

migrateOrganizationData(organizationId, targetDatabaseUrl)
  .catch(console.error)
  .finally(() => mainPrisma.$disconnect());
```

Exécutez-le :
```bash
npx tsx scripts/migrate-org-data.ts <org-id> <database-url>
```

## ⚙️ Étape 5 : Activer le Mode Multi-Bases

Ajoutez la variable d'environnement suivante dans Railway (ou votre plateforme) :

```bash
ENABLE_MULTI_DATABASE=true
```

**Important** : Sans cette variable, le système utilisera le mode partagé (comportement actuel).

## ✅ Étape 6 : Vérifier la Configuration

### Vérifier via l'API

```bash
# Vérifier la configuration d'une organisation
curl https://votre-app.com/api/organizations/{org-id}/database

# Réponse attendue :
# {
#   "success": true,
#   "data": {
#     "organizationId": "...",
#     "organizationName": "Org 1",
#     "databaseUrl": "postgresql://...",
#     "hasDedicatedDatabase": true
#   }
# }
```

### Vérifier dans les logs

Lorsqu'une requête est faite, vous devriez voir dans les logs :
```
✅ Using dedicated database for organization: org-id-1
```

## 🔐 Sécurité : Stockage des URLs

**⚠️ IMPORTANT** : Les URLs de base de données contiennent des credentials sensibles. Voici les bonnes pratiques :

### Option 1 : Stockage Direct (Simple mais moins sécurisé)

Les URLs sont stockées directement dans la colonne `databaseUrl` de la table `Organization`.

**Avantages** :
- Simple à implémenter
- Facile à modifier

**Inconvénients** :
- Les credentials sont en clair dans la base
- Risque si la base principale est compromise

### Option 2 : Stockage avec Chiffrement (Recommandé)

Chiffrez les URLs avant de les stocker :

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.DATABASE_URL_ENCRYPTION_KEY!; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### Option 3 : Utiliser un Gestionnaire de Secrets (Meilleure pratique)

Utilisez un service comme :
- **Railway Variables** : Stockez les URLs comme variables d'environnement par organisation
- **AWS Secrets Manager** : Pour les déploiements AWS
- **HashiCorp Vault** : Pour les environnements enterprise

## 📊 Exemple Complet : Migration de 2 Organisations

```bash
# 1. Créer les bases sur Railway
# (via l'interface ou CLI)

# 2. Exécuter les migrations
DATABASE_URL="postgresql://postgres:pass@host:port/org1_db" npx prisma migrate deploy
DATABASE_URL="postgresql://postgres:pass@host:port/org2_db" npx prisma migrate deploy

# 3. Configurer les URLs (via SQL)
psql $DATABASE_URL << EOF
UPDATE "Organization" 
SET "databaseUrl" = 'postgresql://postgres:pass@host:port/org1_db'
WHERE slug = 'org-1';

UPDATE "Organization" 
SET "databaseUrl" = 'postgresql://postgres:pass@host:port/org2_db'
WHERE slug = 'org-2';
EOF

# 4. Migrer les données (optionnel)
npx tsx scripts/migrate-org-data.ts <org-1-id> 'postgresql://postgres:pass@host:port/org1_db'
npx tsx scripts/migrate-org-data.ts <org-2-id> 'postgresql://postgres:pass@host:port/org2_db'

# 5. Activer le mode multi-bases
# Ajouter ENABLE_MULTI_DATABASE=true dans Railway

# 6. Redéployer l'application
# Le système utilisera automatiquement les bases dédiées
```

## 🐛 Dépannage

### Erreur : "Cannot connect to database"

- Vérifiez que l'URL est correcte
- Vérifiez que la base existe et est accessible
- Vérifiez les credentials et permissions

### Erreur : "Schema mismatch"

- Assurez-vous d'avoir exécuté `prisma migrate deploy` sur toutes les bases
- Vérifiez que toutes les bases ont le même schéma

### Les données n'apparaissent pas

- Vérifiez que `ENABLE_MULTI_DATABASE=true` est défini
- Vérifiez que `databaseUrl` est bien configuré dans la table Organization
- Consultez les logs pour voir quelle base est utilisée

## 📚 Ressources

- [Railway PostgreSQL Documentation](https://docs.railway.app/databases/postgresql)
- [Prisma Multi-Database Guide](https://www.prisma.io/docs/guides/database/multi-database)
- [Guide de Configuration Multi-Bases](./MULTI_DATABASE_SETUP.md)

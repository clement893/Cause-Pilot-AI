# Guide de Configuration Multi-Bases de Données

Ce guide explique comment configurer des bases de données séparées pour chaque organisation afin d'améliorer la sécurité et l'isolation des données.

## 🎯 Avantages

- **Isolation complète** : Chaque organisation a ses propres données dans une base séparée
- **Sécurité renforcée** : Impossible d'accéder aux données d'une autre organisation même en cas de bug
- **Scaling indépendant** : Chaque organisation peut avoir sa propre configuration de base de données
- **Sauvegardes ciblées** : Possibilité de sauvegarder/restaurer par organisation

## 📋 Prérequis

1. Avoir accès à plusieurs bases de données PostgreSQL (Railway, Supabase, AWS RDS, etc.)
2. Avoir les URLs de connexion pour chaque base
3. Avoir exécuté les migrations Prisma sur toutes les bases

## 🔧 Configuration

### 1. Activer le mode multi-bases

Ajoutez la variable d'environnement suivante :

```bash
ENABLE_MULTI_DATABASE=true
```

### 2. Créer les bases de données

Pour chaque organisation, créez une nouvelle base de données PostgreSQL et notez son URL de connexion.

**Exemple avec Railway :**
- Base principale : `postgresql://user:pass@host:port/main_db`
- Organisation 1 : `postgresql://user:pass@host:port/org1_db`
- Organisation 2 : `postgresql://user:pass@host:port/org2_db`

### 3. Exécuter les migrations sur chaque base

Pour chaque nouvelle base de données, exécutez les migrations Prisma :

```bash
# Pour la base de l'organisation 1
DATABASE_URL="postgresql://user:pass@host:port/org1_db" npx prisma migrate deploy

# Pour la base de l'organisation 2
DATABASE_URL="postgresql://user:pass@host:port/org2_db" npx prisma migrate deploy
```

### 4. Configurer les organisations

#### Option A : Via l'API REST

```bash
# Configurer une base dédiée pour une organisation
curl -X PUT https://votre-app.com/api/organizations/{org-id}/database \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "databaseUrl": "postgresql://user:pass@host:port/org1_db"
  }'

# Retourner au mode partagé (utiliser la base principale)
curl -X PUT https://votre-app.com/api/organizations/{org-id}/database \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "databaseUrl": null
  }'
```

#### Option B : Directement dans la base principale

```sql
-- Mettre à jour l'URL de la base pour une organisation
UPDATE "Organization" 
SET "databaseUrl" = 'postgresql://user:pass@host:port/org1_db'
WHERE id = 'organization-id-here';

-- Retourner au mode partagé
UPDATE "Organization" 
SET "databaseUrl" = NULL
WHERE id = 'organization-id-here';
```

## 🔄 Migration des Données Existantes

Si vous avez déjà des données dans une base partagée et que vous voulez migrer vers des bases séparées :

### 1. Créer la nouvelle base pour l'organisation

```bash
# Créer la base
createdb org1_db

# Exécuter les migrations
DATABASE_URL="postgresql://user:pass@host:port/org1_db" npx prisma migrate deploy
```

### 2. Migrer les données

```bash
# Exporter les données de l'organisation depuis la base principale
pg_dump "postgresql://user:pass@host:port/main_db" \
  --table="Donor" \
  --table="Donation" \
  --table="DonorPreference" \
  --where="organizationId='org-id-here'" \
  > org1_data.sql

# Importer dans la nouvelle base
psql "postgresql://user:pass@host:port/org1_db" < org1_data.sql
```

### 3. Mettre à jour la configuration

```sql
UPDATE "Organization" 
SET "databaseUrl" = 'postgresql://user:pass@host:port/org1_db'
WHERE id = 'org-id-here';
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Base Principale (Main DB)       │
│  - Organizations                        │
│  - Users                                │
│  - AdminUsers                           │
│  - Sessions                             │
└─────────────────────────────────────────┘
              │
              ├─────────────────┬─────────────────┐
              │                 │                 │
    ┌─────────▼─────────┐ ┌───▼────┐ ┌─────────▼─────────┐
    │  Base Org 1        │ │ Shared │ │  Base Org 2        │
    │  - Donors          │ │  DB    │ │  - Donors          │
    │  - Donations       │ │        │ │  - Donations       │
    │  - Campaigns       │ │        │ │  - Campaigns       │
    │  - etc.            │ │        │ │  - etc.            │
    └────────────────────┘ └────────┘ └────────────────────┘
```

## 🔐 Sécurité

### Bonnes Pratiques

1. **Stockage sécurisé des URLs** : Utilisez des variables d'environnement ou un gestionnaire de secrets
2. **Chiffrement** : Assurez-vous que les connexions utilisent SSL/TLS
3. **Accès restreint** : Limitez l'accès aux bases de données aux seules applications nécessaires
4. **Audit** : Loggez tous les accès aux bases de données
5. **Backup** : Configurez des sauvegardes régulières pour chaque base

### Variables d'Environnement Recommandées

```bash
# Base principale (toujours requise)
DATABASE_URL="postgresql://user:pass@host:port/main_db"

# Mode multi-bases (optionnel)
ENABLE_MULTI_DATABASE=true

# URLs des bases par organisation (stockées dans la table Organization)
# Ne pas mettre dans .env, mais dans la base de données
```

## 🧪 Test

Pour tester la configuration :

```bash
# Vérifier qu'une organisation utilise une base dédiée
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

## ⚠️ Notes Importantes

1. **Base Principale** : La base principale contient toujours les métadonnées (Organizations, Users, etc.)
2. **Mode Partagé** : Si `databaseUrl` est `null`, l'organisation utilise la base principale avec filtrage par `organizationId`
3. **Migrations** : Toutes les bases doivent avoir le même schéma Prisma
4. **Performance** : Le système met en cache les connexions Prisma pour éviter de recréer des clients à chaque requête
5. **Fallback** : En cas d'erreur de connexion à une base dédiée, le système utilise la base principale

## 🐛 Dépannage

### Problème : "Cannot connect to database"

- Vérifiez que l'URL de la base de données est correcte
- Vérifiez que la base de données existe et est accessible
- Vérifiez les credentials et les permissions

### Problème : "Schema mismatch"

- Assurez-vous d'avoir exécuté les migrations sur toutes les bases
- Vérifiez que toutes les bases ont le même schéma Prisma

### Problème : "Organization not found"

- Vérifiez que l'organisation existe dans la base principale
- Vérifiez que vous utilisez le bon ID d'organisation

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Railway Database Guide](https://docs.railway.app/databases/postgresql)

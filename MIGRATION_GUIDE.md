# Guide de Migration - Support Multi-Organisation pour les Donateurs

## 📋 Vue d'ensemble

Ce guide explique comment migrer les donateurs existants pour les lier aux organisations dans le système multi-organisation.

## 🔧 Étapes de Migration

### 1. Appliquer la Migration Prisma

D'abord, vous devez appliquer la migration pour ajouter le champ `organizationId` à la table `Donor`:

```bash
# Option 1: Utiliser Prisma Migrate (recommandé)
npx prisma migrate dev --name add_organization_to_donors

# Option 2: Appliquer manuellement le SQL
# Exécutez le fichier prisma/migrations/add_organization_to_donors.sql dans votre base de données
```

### 2. Créer une Organisation (si nécessaire)

Si vous n'avez pas encore d'organisation, créez-en une via l'interface ou directement en base de données:

```sql
INSERT INTO "Organization" (id, name, slug, status, plan, currency, language, country)
VALUES ('org-1', 'Mon Organisation', 'mon-org', 'ACTIVE', 'FREE', 'CAD', 'fr', 'CA');
```

### 3. Lier les Donateurs Existants

#### Option A: Via le Script de Migration (Recommandé)

1. Définir l'ID de l'organisation par défaut:
```bash
export DEFAULT_ORG_ID="votre-org-id-ici"
```

2. Exécuter le script:
```bash
npx tsx prisma/migrate-donors-to-org.ts
```

#### Option B: Via SQL Direct

```sql
-- Remplacer 'YOUR_ORG_ID' par l'ID de votre organisation
UPDATE "Donor" 
SET "organizationId" = 'YOUR_ORG_ID' 
WHERE "organizationId" IS NULL;
```

#### Option C: Via l'Interface Admin

1. Aller dans `/organizations`
2. Créer ou sélectionner une organisation
3. Utiliser l'interface pour lier les donateurs (à implémenter si nécessaire)

## 🔍 Vérification

Après la migration, vérifiez que les donateurs sont bien liés:

```sql
-- Vérifier les donateurs sans organisation
SELECT COUNT(*) FROM "Donor" WHERE "organizationId" IS NULL;

-- Vérifier la répartition par organisation
SELECT o.name, COUNT(d.id) as donor_count
FROM "Organization" o
LEFT JOIN "Donor" d ON d."organizationId" = o.id
GROUP BY o.id, o.name;
```

## 📝 Notes Importantes

1. **Donateurs Existants**: Les donateurs créés avant cette migration n'auront pas d'`organizationId` par défaut. Vous devez les lier manuellement.

2. **Nouveaux Donateurs**: Les nouveaux donateurs créés via l'interface seront automatiquement liés à l'organisation courante sélectionnée.

3. **Compatibilité**: Les API continuent de fonctionner sans `organizationId` pour la rétrocompatibilité, mais filtreront uniquement les donateurs sans organisation si aucune organisation n'est fournie.

4. **Migration Progressive**: Le champ `organizationId` est nullable pour permettre une migration progressive sans casser les données existantes.

## 🚀 Après la Migration

Une fois la migration terminée:

1. ✅ Les nouveaux donateurs seront automatiquement liés à l'organisation courante
2. ✅ Les listes de donateurs filtreront par organisation
3. ✅ Le dashboard affichera les statistiques par organisation
4. ✅ Chaque organisation aura ses propres donateurs isolés

## ⚠️ Problèmes Courants

### Les donateurs n'apparaissent pas après le changement d'organisation

**Solution**: Vérifiez que les donateurs ont bien un `organizationId` défini:
```sql
SELECT id, "firstName", "lastName", "organizationId" FROM "Donor" LIMIT 10;
```

### Erreur de contrainte de clé étrangère

**Solution**: Assurez-vous que l'organisation existe avant de lier les donateurs:
```sql
SELECT id, name FROM "Organization";
```

---

*Pour toute question, consultez le fichier `SECURITY_FIXES.md` pour plus d'informations sur les changements de sécurité.*

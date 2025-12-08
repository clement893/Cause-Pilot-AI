# Cause Pilot AI

Application Next.js avec PostgreSQL, déployée sur Railway.

## Stack Technique

- **Framework**: Next.js 15.5.7 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL avec Prisma ORM 5.22.0
- **Styling**: Tailwind CSS 4
- **Runtime**: Node.js 20+

## Développement Local

```bash
# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev

# Ouvrir http://localhost:3000
```

## Base de Données

```bash
# Générer le client Prisma
pnpm postinstall

# Pousser le schéma vers la base de données
pnpm db:push

# Ouvrir Prisma Studio
pnpm db:studio

# Déployer les migrations
pnpm db:migrate
```

## Déploiement sur Railway

### 1. Créer un projet Railway

1. Connectez-vous à [railway.app](https://railway.app)
2. Créez un nouveau projet depuis GitHub
3. Sélectionnez le repository "Cause-Pilot-AI"

### 2. Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur "New"
2. Sélectionnez "Database" → "PostgreSQL"
3. Railway créera automatiquement la base de données

### 3. Configurer les Variables d'Environnement

Dans les paramètres de votre service, ajoutez :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL (fournie par Railway) |
| `DIRECT_DATABASE_URL` | Même valeur que DATABASE_URL |

### 4. Déployer

Railway déploiera automatiquement à chaque push sur la branche main.

## Structure du Projet

```
├── prisma/
│   └── schema.prisma    # Schéma de la base de données
├── src/
│   ├── app/             # Pages Next.js (App Router)
│   └── lib/
│       └── prisma.ts    # Client Prisma
├── next.config.mjs      # Configuration Next.js
├── railway.toml         # Configuration Railway
└── nixpacks.toml        # Configuration Nixpacks
```

## Scripts Disponibles

| Script | Description |
|--------|-------------|
| `pnpm dev` | Lancer le serveur de développement |
| `pnpm build` | Construire pour la production |
| `pnpm start` | Démarrer le serveur de production |
| `pnpm lint` | Vérifier le code avec ESLint |
| `pnpm db:push` | Pousser le schéma vers la DB |
| `pnpm db:migrate` | Déployer les migrations |
| `pnpm db:studio` | Ouvrir Prisma Studio |

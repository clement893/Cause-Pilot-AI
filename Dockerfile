# Dockerfile pour Railway avec support de --no-frozen-lockfile
FROM node:20-slim

WORKDIR /app/

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers de configuration
COPY package.json pnpm-lock.yaml* ./

# Installer les dépendances Node.js (sans frozen-lockfile pour permettre la mise à jour)
RUN pnpm install --no-frozen-lockfile

# Copier le reste des fichiers
COPY . .

# Générer Prisma Client
RUN pnpm prisma generate

# Build de l'application
RUN NODE_ENV=production pnpm build

# Commande de démarrage
CMD ["pnpm", "start"]


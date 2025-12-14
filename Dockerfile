# Dockerfile pour Railway avec support de --no-frozen-lockfile
FROM node:20-slim

WORKDIR /app/

# Installer pnpm et OpenSSL (requis pour Prisma)
RUN apt-get update -y && \
    apt-get install -y openssl && \
    npm install -g pnpm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copier les fichiers de configuration et Prisma schema
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Installer les dépendances Node.js (sans frozen-lockfile pour permettre la mise à jour)
# Le postinstall générera automatiquement Prisma Client
RUN pnpm install --no-frozen-lockfile

# Copier le reste des fichiers
COPY . .

# Build de l'application
RUN NODE_ENV=production pnpm build

# Copier le script de démarrage
COPY scripts/start.sh /app/scripts/start.sh
RUN chmod +x /app/scripts/start.sh

# Commande de démarrage
# Exécute prisma db push au démarrage (quand DATABASE_URL est disponible) puis démarre l'application
CMD ["/app/scripts/start.sh"]


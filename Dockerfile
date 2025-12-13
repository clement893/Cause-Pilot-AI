# Dockerfile pour Railway avec support de --no-frozen-lockfile
FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

WORKDIR /app/

# Copier les fichiers de configuration Nixpacks
COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix

# Installer les dépendances Nix
RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d

# Copier les fichiers du projet
COPY . /app/.

# Installer les dépendances Node.js (sans frozen-lockfile pour permettre la mise à jour)
RUN --mount=type=cache,id=s/e2088e2a-6a7b-4f28-b3d1-5d17fb6a96c9-/root/local/share/pnpm/store/v3,target=/root/.local/share/pnpm/store/v3 \
    pnpm install --no-frozen-lockfile

# Build de l'application
RUN --mount=type=cache,id=s/e2088e2a-6a7b-4f28-b3d1-5d17fb6a96c9-next/cache,target=/app/.next/cache \
    --mount=type=cache,id=s/e2088e2a-6a7b-4f28-b3d1-5d17fb6a96c9-node_modules/cache,target=/app/node_modules/.cache \
    NODE_ENV=production pnpm build

# Ajouter les binaires node_modules au PATH
RUN printf '\nPATH=/app/node_modules/.bin:$PATH' >> /root/.profile

# Commande de démarrage
CMD ["pnpm", "start"]


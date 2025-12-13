# Variables d'environnement pour Railway

## Variables à corriger/modifier

### 1. NODE_ENV
**Actuel:** `NODE_ENV="development"`  
**Doit être:** `NODE_ENV="production"`  
**Raison:** Vous êtes en production sur Railway, pas en développement local.

### 2. NEXT_PUBLIC_APP_URL
**Actuel:** `NEXT_PUBLIC_APP_URL="http://localhost:3000"`  
**Doit être:** `NEXT_PUBLIC_APP_URL="https://web-production-4c73d.up.railway.app"`  
**Raison:** Doit pointer vers votre URL Railway, pas localhost.

### 3. DIRECT_DATABASE_URL
**Actuel:** `DIRECT_DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"`  
**Doit être:** `DIRECT_DATABASE_URL="postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway"`  
**Raison:** Utilisez la même URL que DATABASE_URL mais avec l'URL publique (hopper.proxy.rlwy.net) au lieu de l'URL interne.

### 4. NEXTAUTH_URL
**Actuel:** `NEXTAUTH_URL="https://web-production-4c73d.up.railway.app/"`  
**Doit être:** `NEXTAUTH_URL="https://web-production-4c73d.up.railway.app"` (sans le slash final)  
**Raison:** Le slash final peut causer des problèmes avec NextAuth.

## Variables correctes (à garder telles quelles)

- `DATABASE_URL` ✅
- `GOOGLE_CLIENT_ID` ✅
- `GOOGLE_CLIENT_SECRET` ✅
- `NEXTAUTH_SECRET` ✅
- `SENDGRID_API_KEY` ✅
- `OPENAI_API_KEY` ✅
- `ENABLE_MULTI_DATABASE` ✅

## Configuration complète recommandée

```env
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@postgres.railway.internal:5432/railway"
DIRECT_DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@hopper.proxy.rlwy.net:10280/railway"
NEXT_PUBLIC_APP_URL="https://web-production-4c73d.up.railway.app"
NODE_ENV="production"
NEXTAUTH_URL="https://web-production-4c73d.up.railway.app"
NEXTAUTH_SECRET="VOTRE_SECRET_NEXTAUTH"
GOOGLE_CLIENT_ID="VOTRE_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="VOTRE_GOOGLE_CLIENT_SECRET"
SENDGRID_FROM_EMAIL="hello@nukleo.digital"
SENDGRID_FROM_NAME="CausePilotAI"
SENDGRID_API_KEY="VOTRE_SENDGRID_API_KEY"
OPENAI_API_KEY="VOTRE_OPENAI_API_KEY"
ENABLE_MULTI_DATABASE="true"
SEED_SECRET_TOKEN="VOTRE_SEED_SECRET_TOKEN"
```

**Note:** Remplacez tous les placeholders `VOTRE_*` par vos vraies valeurs dans Railway.

## Actions à faire sur Railway

1. Allez dans votre projet Railway
2. Cliquez sur "Variables" dans le menu
3. Modifiez ces variables :
   - `NODE_ENV` → `production`
   - `NEXT_PUBLIC_APP_URL` → `https://web-production-4c73d.up.railway.app`
   - `DIRECT_DATABASE_URL` → `postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway`
   - `NEXTAUTH_URL` → `https://web-production-4c73d.up.railway.app` (sans slash final)
4. Redéployez l'application

## Vérification après modification

Après avoir modifié les variables et redéployé :
1. Connectez-vous sur `/super-admin/login`
2. Vérifiez les cookies dans DevTools (F12) → Application → Cookies
3. Testez `/api/super-admin/test-auth` pour voir si la session est détectée
4. Consultez les logs Railway pour voir les messages de debug


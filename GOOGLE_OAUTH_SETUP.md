# Configuration Google OAuth pour Super Admin

## Problème

Si vous voyez l'erreur `error=Configuration` lors de la connexion super-admin, cela signifie que les variables d'environnement Google OAuth ne sont pas configurées sur Railway.

## Variables d'environnement requises

Vous devez configurer les variables suivantes sur Railway :

### 1. Google OAuth Credentials

#### `GOOGLE_CLIENT_ID`
- Où l'obtenir : [Google Cloud Console](https://console.cloud.google.com/)
- Étapes :
  1. Créez un projet ou sélectionnez un projet existant
  2. Activez l'API "Google+ API" ou "Google Identity"
  3. Allez dans "Credentials" → "Create Credentials" → "OAuth client ID"
  4. Type d'application : "Web application"
  5. Authorized redirect URIs : 
     - `https://web-production-4c73d.up.railway.app/api/auth/callback/google`
     - (Ajoutez aussi `http://localhost:3000/api/auth/callback/google` pour le développement local)
  6. Copiez le "Client ID"

#### `GOOGLE_CLIENT_SECRET`
- Obtenu en même temps que le `GOOGLE_CLIENT_ID` dans Google Cloud Console
- Copiez le "Client secret"

### 2. NextAuth Configuration

#### `AUTH_SECRET` ou `NEXTAUTH_SECRET`
- Générer un secret aléatoire :
  ```bash
  openssl rand -base64 32
  ```
- Ou utiliser un générateur en ligne
- **Important** : Gardez ce secret sécurisé et ne le partagez jamais

#### `AUTH_URL` ou `NEXTAUTH_URL`
- URL de votre application Railway :
  ```
  https://web-production-4c73d.up.railway.app
  ```
- **Important** : Pas de slash final (`/`)

#### `NEXT_PUBLIC_APP_URL` (optionnel mais recommandé)
- Même valeur que `NEXTAUTH_URL` :
  ```
  https://web-production-4c73d.up.railway.app
  ```

## Configuration sur Railway

1. Connectez-vous à [Railway](https://railway.app)
2. Sélectionnez votre projet "Cause-Pilot-AI"
3. Allez dans l'onglet "Variables"
4. Ajoutez chaque variable d'environnement :
   - Cliquez sur "New Variable"
   - Entrez le nom de la variable
   - Entrez la valeur
   - Cliquez sur "Add"

## Vérification

Après avoir configuré les variables :

1. Redéployez l'application sur Railway (ou attendez le redéploiement automatique)
2. Vérifiez les logs Railway pour confirmer qu'il n'y a plus d'erreurs de configuration
3. Essayez de vous connecter à nouveau sur `/super-admin/login`

## Erreurs courantes

### "Configuration" error
- **Cause** : Variables `GOOGLE_CLIENT_ID` ou `GOOGLE_CLIENT_SECRET` manquantes
- **Solution** : Vérifiez que les deux variables sont définies sur Railway

### "AccessDenied" error
- **Cause** : L'email utilisé n'est pas du domaine `@nukleo.com`
- **Solution** : Utilisez un compte Google avec une adresse email `@nukleo.com`

### Redirect URI mismatch
- **Cause** : L'URI de redirection dans Google Cloud Console ne correspond pas
- **Solution** : Vérifiez que l'URI exacte est : `https://web-production-4c73d.up.railway.app/api/auth/callback/google`

## Configuration Google Cloud Console

### Restrictions de domaine

Le code restreint automatiquement l'accès aux utilisateurs du domaine `nukleo.com` via le paramètre `hd` dans la configuration OAuth.

Si vous avez besoin de changer le domaine autorisé :
1. Modifiez la constante `ALLOWED_DOMAIN` dans `src/lib/auth.ts`
2. Modifiez également la constante dans `src/lib/super-admin-auth.ts`

## Test local

Pour tester en local, créez un fichier `.env.local` :

```env
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
AUTH_SECRET=votre_secret_genere
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note** : N'oubliez pas d'ajouter `http://localhost:3000/api/auth/callback/google` dans les Authorized redirect URIs de Google Cloud Console.

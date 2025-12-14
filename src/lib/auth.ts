import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { CustomPrismaAdapter } from "./prisma-adapter";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import type { AdapterUser } from "next-auth/adapters";

// Domaine autorisé pour l'authentification admin
const ALLOWED_DOMAIN = "nukleo.com";

// Étendre le type Session pour inclure role et status
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      status?: string;
    };
  }
}

// Variables d'environnement - utiliser directement sans nettoyage complexe
// Railway injecte les variables directement, pas besoin de nettoyer les guillemets
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

// Logs de débogage simples
if (process.env.NODE_ENV === "production") {
  console.log("🔍 Google OAuth Configuration:");
  console.log(`   GOOGLE_CLIENT_ID: ${googleClientId ? `présent (${googleClientId.length} chars)` : "manquant"}`);
  console.log(`   GOOGLE_CLIENT_SECRET: ${googleClientSecret ? `présent (${googleClientSecret.length} chars)` : "manquant"}`);
}

if (!googleClientId || !googleClientSecret) {
  console.error("❌ GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET manquant");
}
if (!authSecret) {
  console.error("❌ AUTH_SECRET ou NEXTAUTH_SECRET manquant");
}

// Construire la liste des providers
const providers = [];

// Ajouter Google OAuth si les credentials sont disponibles
if (googleClientId && googleClientSecret) {
  providers.push(Google({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
        // Ne pas restreindre avec hd pour permettre d'autres domaines pour les membres d'organisation
        // La vérification se fait dans le callback signIn
      },
    },
  }));
  if (process.env.NODE_ENV === "production") {
    console.log("✅ Provider Google OAuth ajouté");
  }
}

// Toujours ajouter le provider Credentials
providers.push(
    Credentials({
      name: "Email / Mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email as string },
          include: {
            AdminOrganizationAccess: {
              select: {
                organizationId: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        // Si l'utilisateur n'a pas de mot de passe, il doit utiliser Google OAuth
        if (!user.password) {
          return null;
        }

        // Vérifier le mot de passe
        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // Vérifier que l'utilisateur est actif
        if (user.status !== "ACTIVE") {
          return null;
        }

        // Retourner l'utilisateur pour NextAuth
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: CustomPrismaAdapter(prisma),
  secret: authSecret || "fallback-secret-for-development",
  basePath: "/api/auth",
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // Si c'est une connexion Credentials (email/mot de passe), elle a déjà été validée dans authorize()
      if (account?.provider === "credentials") {
        return true;
      }

      // Pour Google OAuth, vérifier si l'utilisateur existe déjà dans la base de données
      if (user.email) {
        const existingUser = await prisma.adminUser.findUnique({
          where: { email: user.email },
          select: { role: true, status: true },
        });

        // Si l'utilisateur existe déjà, permettre la connexion (peut être admin ou membre d'organisation)
        if (existingUser) {
          return true;
        }

        // Si l'utilisateur n'existe pas encore, vérifier le domaine uniquement pour les super admins
        // Les membres d'organisation peuvent avoir d'autres domaines mais doivent utiliser email/mot de passe
        const domain = user.email.split("@")[1];
        if (domain !== ALLOWED_DOMAIN) {
          console.log(`Accès refusé pour ${user.email} - domaine non autorisé pour les nouveaux utilisateurs admin. Utilisez email/mot de passe pour les membres d'organisation.`);
          return false;
        }
      }
      return true;
    },
    async session({ session, user }) {
      // Avec la stratégie "database", user est un AdapterUser
      const adapterUser = user as AdapterUser;
      
      if (session.user && adapterUser) {
        session.user.id = adapterUser.id;
        
        // Récupérer le rôle et le statut de l'admin
        const adminUser = await prisma.adminUser.findUnique({
          where: { id: adapterUser.id },
          select: { role: true, status: true },
        });
        if (adminUser) {
          session.user.role = adminUser.role;
          session.user.status = adminUser.status;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/super-admin/login",
    error: "/super-admin/login",
  },
  events: {
    async signIn({ user }) {
      // Mettre à jour la date de dernière connexion
      if (user.id) {
        try {
          await prisma.adminUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
          // Log d'audit
          await prisma.adminAuditLog.create({
            data: {
              action: "LOGIN",
              entityType: "AdminUser",
              entityId: user.id,
              description: `Connexion de ${user.email}`,
              adminUserId: user.id,
            },
          });
        } catch (error) {
          console.error("Erreur lors de la mise à jour du login:", error);
        }
      }
    },
  },
  session: {
    strategy: "database",
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // Utiliser secure=true si on est sur Railway (URL contient railway.app) ou si NODE_ENV=production
        secure: process.env.NEXTAUTH_URL?.includes('railway.app') || process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.includes('railway.app') || process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.includes('railway.app') || process.env.NODE_ENV === 'production',
      },
    },
  },
});

// Helper pour vérifier si l'utilisateur est super admin
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });
  return adminUser?.role === "SUPER_ADMIN" && adminUser?.status === "ACTIVE";
}

// Helper pour vérifier l'accès à une organisation
export async function hasOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });

  // Super admin a accès à tout
  if (adminUser?.role === "SUPER_ADMIN" && adminUser?.status === "ACTIVE") {
    return true;
  }

  // Vérifier l'accès spécifique à l'organisation
  const access = await prisma.adminOrganizationAccess.findUnique({
    where: {
      adminUserId_organizationId: {
        adminUserId: userId,
        organizationId: organizationId,
      },
    },
  });

  return !!access;
}

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

// Variables d'environnement - utiliser directement
// Railway injecte les variables directement dans process.env
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const authSecret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)?.trim();

// Logs de débogage détaillés (toujours en production pour diagnostiquer)
console.log("🔍 [AUTH] Google OAuth Configuration Check:");
console.log(`   GOOGLE_CLIENT_ID: ${googleClientId ? `✅ présent (${googleClientId.length} chars, starts with: ${googleClientId.substring(0, 10)}...)` : "❌ manquant"}`);
console.log(`   GOOGLE_CLIENT_SECRET: ${googleClientSecret ? `✅ présent (${googleClientSecret.length} chars, starts with: ${googleClientSecret.substring(0, 5)}...)` : "❌ manquant"}`);
console.log(`   AUTH_SECRET: ${authSecret ? `✅ présent (${authSecret.length} chars)` : "❌ manquant"}`);

if (!googleClientId || !googleClientSecret) {
  console.error("❌ [AUTH] GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET manquant ou vide");
  console.error(`   GOOGLE_CLIENT_ID type: ${typeof googleClientId}, value: "${googleClientId}"`);
  console.error(`   GOOGLE_CLIENT_SECRET type: ${typeof googleClientSecret}, value: "${googleClientSecret?.substring(0, 5)}..."`);
}
if (!authSecret) {
  console.error("❌ [AUTH] AUTH_SECRET ou NEXTAUTH_SECRET manquant");
}

// Construire la liste des providers
const providers = [];

// Ajouter Google OAuth si les credentials sont disponibles
if (googleClientId && googleClientSecret && googleClientId.length > 0 && googleClientSecret.length > 0) {
  try {
    const googleProvider = Google({
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
    });
    providers.push(googleProvider);
    console.log("✅ [AUTH] Provider Google OAuth ajouté avec succès");
  } catch (error) {
    console.error("❌ [AUTH] Erreur lors de la création du provider Google:", error);
  }
} else {
  console.warn("⚠️  [AUTH] Provider Google OAuth NON ajouté - credentials manquants ou invalides");
  console.warn(`   googleClientId valide: ${!!googleClientId && googleClientId.length > 0}`);
  console.warn(`   googleClientSecret valide: ${!!googleClientSecret && googleClientSecret.length > 0}`);
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

// Vérifier qu'on a au moins un provider
if (providers.length === 0) {
  console.error("❌ [AUTH] ERREUR CRITIQUE: Aucun provider configuré!");
  console.error("   NextAuth ne peut pas fonctionner sans au moins un provider.");
  throw new Error("NextAuth configuration error: No authentication providers configured. Please check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.");
}

console.log(`✅ [AUTH] NextAuth initialisé avec ${providers.length} provider(s)`);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: CustomPrismaAdapter(prisma),
  secret: authSecret || "fallback-secret-for-development",
  basePath: "/api/auth",
  providers,
  callbacks: {
    async signIn({ user, account }) {
      console.log(`[AUTH] signIn callback - provider: ${account?.provider}, email: ${user.email}`);
      
      // Si c'est une connexion Credentials (email/mot de passe), elle a déjà été validée dans authorize()
      if (account?.provider === "credentials") {
        console.log(`[AUTH] Credentials login allowed for ${user.email}`);
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
          console.log(`[AUTH] Existing user ${user.email} found, allowing sign in. Role: ${existingUser.role}, Status: ${existingUser.status}`);
          return true;
        }

        // Si l'utilisateur n'existe pas encore, vérifier le domaine uniquement pour les super admins
        // Les membres d'organisation peuvent avoir d'autres domaines mais doivent utiliser email/mot de passe
        const domain = user.email.split("@")[1];
        if (domain !== ALLOWED_DOMAIN) {
          console.log(`[AUTH] Accès refusé pour ${user.email} - domaine ${domain} non autorisé pour les nouveaux utilisateurs admin. Utilisez email/mot de passe pour les membres d'organisation.`);
          return false;
        }
        
        console.log(`[AUTH] New user ${user.email} with allowed domain ${domain}, allowing sign in`);
      }
      return true;
    },
    async session({ session, user }) {
      // Avec la stratégie "database", user est un AdapterUser
      const adapterUser = user as AdapterUser | undefined;
      
      if (session.user) {
        // Si user est disponible (stratégie database), utiliser son id
        if (adapterUser?.id) {
          session.user.id = adapterUser.id;
          
          // Récupérer le rôle et le statut de l'admin
          try {
            const adminUser = await prisma.adminUser.findUnique({
              where: { id: adapterUser.id },
              select: { role: true, status: true },
            });
            if (adminUser) {
              session.user.role = adminUser.role;
              session.user.status = adminUser.status;
            }
          } catch (error) {
            console.error("Error fetching admin user in session callback:", error);
          }
        } else if (session.user.email) {
          // Fallback: chercher par email si user n'est pas disponible
          try {
            const adminUser = await prisma.adminUser.findUnique({
              where: { email: session.user.email },
              select: { id: true, role: true, status: true },
            });
            
            if (adminUser) {
              session.user.id = adminUser.id;
              session.user.role = adminUser.role;
              session.user.status = adminUser.status;
            } else {
              console.warn(`[AUTH] AdminUser not found for email: ${session.user.email}`);
            }
          } catch (error) {
            console.error("Error fetching admin user by email in session callback:", error);
          }
        } else {
          console.warn("[AUTH] Session callback: No user.id and no email available");
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

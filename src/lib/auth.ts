import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { CustomPrismaAdapter } from "./prisma-adapter";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import type { AdapterUser } from "next-auth/adapters";

// Domaine autorisÃƒÆ’Ã‚Â© pour l'authentification admin
const ALLOWED_DOMAIN = "nukleo.com";

// ÃƒÆ’Ã¢â‚¬Â°tendre le type Session pour inclure role et status
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


// Validation des variables d'environnement requises
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("âš ï¸  GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET manquant dans les variables d'environnement");
}
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.error("âš ï¸  AUTH_SECRET ou NEXTAUTH_SECRET manquant dans les variables d'environnement");
}
if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL && !process.env.NEXT_PUBLIC_APP_URL) {
  console.error("âš ï¸  AUTH_URL, NEXTAUTH_URL ou NEXT_PUBLIC_APP_URL manquant dans les variables d'environnement");
}


export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: CustomPrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  basePath: "/api/auth",
  // Utiliser AUTH_URL ou NEXTAUTH_URL pour la configuration
  url: process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://web-production-4c73d.up.railway.app",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // Ne pas restreindre avec hd pour permettre d'autres domaines pour les membres d'organisation
          // La vÃƒÆ’Ã‚Â©rification se fait dans le callback signIn
        },
      },
    }),
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

        // VÃƒÆ’Ã‚Â©rifier le mot de passe
        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // VÃƒÆ’Ã‚Â©rifier que l'utilisateur est actif
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
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Si c'est une connexion Credentials (email/mot de passe), elle a dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© validÃƒÆ’Ã‚Â©e dans authorize()
      if (account?.provider === "credentials") {
        return true;
      }

      // Pour Google OAuth, vÃƒÆ’Ã‚Â©rifier si l'utilisateur existe dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  dans la base de donnÃƒÆ’Ã‚Â©es
      if (user.email) {
        const existingUser = await prisma.adminUser.findUnique({
          where: { email: user.email },
          select: { role: true, status: true },
        });

        // Si l'utilisateur existe dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â , permettre la connexion (peut ÃƒÆ’Ã‚Âªtre admin ou membre d'organisation)
        if (existingUser) {
          return true;
        }

        // Si l'utilisateur n'existe pas encore, vÃƒÆ’Ã‚Â©rifier le domaine uniquement pour les super admins
        // Les membres d'organisation peuvent avoir d'autres domaines mais doivent utiliser email/mot de passe
        const domain = user.email.split("@")[1];
        if (domain !== ALLOWED_DOMAIN) {
          console.log(`AccÃƒÆ’Ã‚Â¨s refusÃƒÆ’Ã‚Â© pour ${user.email} - domaine non autorisÃƒÆ’Ã‚Â© pour les nouveaux utilisateurs admin. Utilisez email/mot de passe pour les membres d'organisation.`);
          return false;
        }
      }
      return true;
    },
    async session({ session, user }) {
      // Avec la stratÃƒÆ’Ã‚Â©gie "database", user est un AdapterUser
      const adapterUser = user as AdapterUser;
      
      if (session.user && adapterUser) {
        session.user.id = adapterUser.id;
        
        // RÃƒÆ’Ã‚Â©cupÃƒÆ’Ã‚Â©rer le rÃƒÆ’Ã‚Â´le et le statut de l'admin
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
      // Mettre ÃƒÆ’Ã‚Â  jour la date de derniÃƒÆ’Ã‚Â¨re connexion
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
          console.error("Erreur lors de la mise ÃƒÆ’Ã‚Â  jour du login:", error);
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

// Helper pour vÃƒÆ’Ã‚Â©rifier si l'utilisateur est super admin
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });
  return adminUser?.role === "SUPER_ADMIN" && adminUser?.status === "ACTIVE";
}

// Helper pour vÃƒÆ’Ã‚Â©rifier l'accÃƒÆ’Ã‚Â¨s ÃƒÆ’Ã‚Â  une organisation
export async function hasOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });

  // Super admin a accÃƒÆ’Ã‚Â¨s ÃƒÆ’Ã‚Â  tout
  if (adminUser?.role === "SUPER_ADMIN" && adminUser?.status === "ACTIVE") {
    return true;
  }

  // VÃƒÆ’Ã‚Â©rifier l'accÃƒÆ’Ã‚Â¨s spÃƒÆ’Ã‚Â©cifique ÃƒÆ’Ã‚Â  l'organisation
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

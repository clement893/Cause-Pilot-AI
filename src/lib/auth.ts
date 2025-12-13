import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { CustomPrismaAdapter } from "./prisma-adapter";
import { prisma } from "./prisma";
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

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: CustomPrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  basePath: "/api/auth",
  // Utiliser AUTH_URL ou NEXTAUTH_URL pour la configuration
  ...(process.env.AUTH_URL || process.env.NEXTAUTH_URL ? {
    url: process.env.AUTH_URL || process.env.NEXTAUTH_URL,
  } : {}),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          hd: ALLOWED_DOMAIN, // Restreindre au domaine nukleo.com
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Vérifier que l'email appartient au domaine autorisé
      if (user.email) {
        const domain = user.email.split("@")[1];
        if (domain !== ALLOWED_DOMAIN) {
          console.log(`Accès refusé pour ${user.email} - domaine non autorisé`);
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

import { PrismaClient } from "@prisma/client";
import type { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from "next-auth/adapters";

/**
 * Custom Prisma Adapter for NextAuth that uses AdminUser instead of User
 * This is necessary because we have a separate User model for the main app
 */
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    async createUser(data) {
      const user = await prisma.adminUser.create({
        data: {
          email: data.email,
          name: data.name,
          image: data.image,
          emailVerified: data.emailVerified,
        },
      });
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      } as AdapterUser;
    },

    async getUser(id) {
      const user = await prisma.adminUser.findUnique({ where: { id } });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      } as AdapterUser;
    },

    async getUserByEmail(email) {
      const user = await prisma.adminUser.findUnique({ where: { email } });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      } as AdapterUser;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { user: true },
      });
      if (!account?.user) return null;
      return {
        id: account.user.id,
        email: account.user.email,
        name: account.user.name,
        image: account.user.image,
        emailVerified: account.user.emailVerified,
      } as AdapterUser;
    },

    async updateUser(data) {
      const user = await prisma.adminUser.update({
        where: { id: data.id },
        data: {
          email: data.email,
          name: data.name,
          image: data.image,
          emailVerified: data.emailVerified,
        },
      });
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      } as AdapterUser;
    },

    async deleteUser(userId) {
      await prisma.adminUser.delete({ where: { id: userId } });
    },

    async linkAccount(data) {
      await prisma.account.create({
        data: {
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state as string | undefined,
        },
      });
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
    },

    async createSession(data) {
      const session = await prisma.session.create({
        data: {
          userId: data.userId,
          sessionToken: data.sessionToken,
          expires: data.expires,
        },
      });
      return {
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: session.expires,
      } as AdapterSession;
    },

    async getSessionAndUser(sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!session) return null;
      return {
        session: {
          userId: session.userId,
          sessionToken: session.sessionToken,
          expires: session.expires,
        } as AdapterSession,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          emailVerified: session.user.emailVerified,
        } as AdapterUser,
      };
    },

    async updateSession(data) {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data: {
          expires: data.expires,
        },
      });
      return {
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: session.expires,
      } as AdapterSession;
    },

    async deleteSession(sessionToken) {
      await prisma.session.delete({ where: { sessionToken } });
    },

    async createVerificationToken(data) {
      const token = await prisma.verificationToken.create({
        data: {
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        },
      });
      return token as VerificationToken;
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier,
              token,
            },
          },
        });
        return verificationToken as VerificationToken;
      } catch {
        return null;
      }
    },
  };
}

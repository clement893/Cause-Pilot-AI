import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { NextResponse } from "next/server";

// Domaine autorisé pour l'accès super-admin
const ALLOWED_DOMAIN = "nukleo.com";

export interface SuperAdminSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Vérifie si l'utilisateur est un super-admin autorisé
 */
export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    // Vérifier le domaine de l'email
    const emailDomain = session.user.email.split("@")[1];
    if (emailDomain?.toLowerCase() !== ALLOWED_DOMAIN) {
      console.log(`Accès refusé: domaine ${emailDomain} non autorisé`);
      return null;
    }

    // Vérifier si l'utilisateur existe dans AdminUser
    let adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
    });

    // Créer l'utilisateur admin s'il n'existe pas
    if (!adminUser) {
      adminUser = await prisma.adminUser.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split("@")[0],
          role: "ADMIN", // Premier utilisateur = SUPER_ADMIN, autres = ADMIN
          status: "ACTIVE",
        },
      });

      // Log de création
      await prisma.adminAuditLog.create({
        data: {
          adminUserId: adminUser.id,
          action: "LOGIN",
          entityType: "AdminUser",
          entityId: adminUser.id,
          description: `Première connexion de ${adminUser.email}`,
          metadata: { firstLogin: true },
        },
      });
    } else {
      // Mettre à jour la dernière connexion
      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Vérifier si l'utilisateur est actif
    if (adminUser.status !== "ACTIVE") {
      console.log(`Accès refusé: utilisateur ${adminUser.email} non actif`);
      return null;
    }

    return {
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la vérification super-admin:", error);
    return null;
  }
}

/**
 * Middleware pour protéger les routes API super-admin
 */
export async function withSuperAdmin(
  handler: (req: Request, session: SuperAdminSession) => Promise<Response>
) {
  return async (req: Request) => {
    const session = await getSuperAdminSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    return handler(req, session);
  };
}

/**
 * Vérifie si l'utilisateur a accès à une organisation spécifique
 */
export async function hasOrganizationAccess(
  adminUserId: string,
  organizationId: string
): Promise<boolean> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    include: {
      managedOrganizations: {
        where: { organizationId },
      },
    },
  });

  if (!adminUser) return false;

  // Les SUPER_ADMIN ont accès à tout
  if (adminUser.role === "SUPER_ADMIN") return true;

  // Vérifier si l'utilisateur a un accès explicite à l'organisation
  return adminUser.managedOrganizations.length > 0;
}

/**
 * Log une action dans l'audit
 */
export async function logAuditAction(
  adminUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  description: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminUserId,
        action,
        entityType,
        entityId,
        description,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error("Erreur lors du log d'audit:", error);
  }
}

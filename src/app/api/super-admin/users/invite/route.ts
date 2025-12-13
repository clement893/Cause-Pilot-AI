import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";
import { randomBytes } from "crypto";

// POST /api/super-admin/users/invite - Inviter un utilisateur admin ou à une organisation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent inviter
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role, organizationId } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { success: false, error: "L'email est requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'email est du domaine nukleo.com
    if (!email.endsWith("@nukleo.com")) {
      return NextResponse.json(
        { success: false, error: "Seuls les emails @nukleo.com sont autorisés" },
        { status: 400 }
      );
    }

    const mainPrisma = getMainPrisma();

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await mainPrisma.adminUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Cet utilisateur existe déjà" },
        { status: 409 }
      );
    }

    // Générer un token d'invitation
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    if (organizationId) {
      // Invitation pour une organisation spécifique
      // Vérifier que l'organisation existe
      const organization = await mainPrisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        return NextResponse.json(
          { success: false, error: "Organisation introuvable" },
          { status: 404 }
        );
      }

      // Créer l'invitation (on utilise le modèle Invitation existant mais adapté)
      // Pour l'instant, on crée directement l'accès à l'organisation
      // L'utilisateur devra se connecter avec Google pour créer son compte
      
      // Créer l'utilisateur admin avec un statut PENDING
      const adminUser = await mainPrisma.adminUser.create({
        data: {
          email,
          role: "ADMIN", // Rôle par défaut pour les membres d'organisation
          status: "INACTIVE", // Inactif jusqu'à ce qu'il accepte l'invitation
        },
      });

      // Créer l'accès à l'organisation
      await mainPrisma.adminOrganizationAccess.create({
        data: {
          adminUserId: adminUser.id,
          organizationId: organizationId,
          canEdit: true,
          canDelete: false,
          canManageUsers: false,
        },
      });

      // Log d'audit
      await mainPrisma.adminAuditLog.create({
        data: {
          action: "CREATE",
          entityType: "AdminUser",
          entityId: adminUser.id,
          description: `Invitation de ${email} à l'organisation ${organization.name}`,
          adminUserId: session.user.id,
          metadata: { 
            email,
            organizationId,
            organizationName: organization.name,
            invitationToken: token,
          },
        },
      });

      // TODO: Envoyer un email d'invitation avec le token
      // Pour l'instant, on retourne juste le succès

      return NextResponse.json(
        { 
          success: true, 
          data: { 
            userId: adminUser.id,
            email: adminUser.email,
            organizationId,
            organizationName: organization.name,
            message: "L'utilisateur peut maintenant se connecter avec son compte Google @nukleo.com",
          } 
        },
        { status: 201 }
      );
    } else {
      // Invitation comme admin général
      if (!role) {
        return NextResponse.json(
          { success: false, error: "Le rôle est requis pour une invitation admin" },
          { status: 400 }
        );
      }

      // Créer l'utilisateur admin
      const adminUser = await mainPrisma.adminUser.create({
        data: {
          email,
          role: role || "ADMIN",
          status: "INACTIVE", // Inactif jusqu'à ce qu'il accepte l'invitation
        },
      });

      // Log d'audit
      await mainPrisma.adminAuditLog.create({
        data: {
          action: "CREATE",
          entityType: "AdminUser",
          entityId: adminUser.id,
          description: `Invitation de ${email} comme ${role}`,
          adminUserId: session.user.id,
          metadata: { 
            email,
            role,
            invitationToken: token,
          },
        },
      });

      // TODO: Envoyer un email d'invitation avec le token
      // Pour l'instant, on retourne juste le succès

      return NextResponse.json(
        { 
          success: true, 
          data: { 
            userId: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            message: "L'utilisateur peut maintenant se connecter avec son compte Google @nukleo.com",
          } 
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'invitation de l'utilisateur", details: String(error) },
      { status: 500 }
    );
  }
}


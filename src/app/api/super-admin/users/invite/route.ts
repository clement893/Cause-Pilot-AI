import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";
import { sendInvitationEmail } from "@/lib/sendgrid";
import { SuperAdminRole } from "@prisma/client";
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

    // Récupérer le nom de l'inviteur
    const inviter = await mainPrisma.adminUser.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

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

      // Créer l'invitation dans la base de données
      const invitation = await mainPrisma.adminInvitation.create({
        data: {
          email,
          token,
          expiresAt,
          invitedBy: session.user.id,
          invitedByName: inviter?.name || inviter?.email || "Super Admin",
          organizationId: organizationId,
          role: "ADMIN", // Rôle par défaut pour les membres d'organisation
        },
      });

      // Envoyer l'email d'invitation
      try {
        await sendInvitationEmail({
          email,
          token,
          inviteType: "organization",
          organizationName: organization.name,
          invitedByName: inviter?.name || inviter?.email || "Super Admin",
        });
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        // Ne pas échouer si l'email ne peut pas être envoyé, l'invitation est quand même créée
      }

      // Log d'audit
      await mainPrisma.adminAuditLog.create({
        data: {
          action: "CREATE",
          entityType: "AdminInvitation",
          entityId: invitation.id,
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

      return NextResponse.json(
        { 
          success: true, 
          data: { 
            invitationId: invitation.id,
            email: invitation.email,
            organizationId,
            organizationName: organization.name,
            message: "Invitation envoyée par email",
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

      // Créer l'invitation dans la base de données
      const invitation = await mainPrisma.adminInvitation.create({
        data: {
          email,
          token,
          expiresAt,
          invitedBy: session.user.id,
          invitedByName: inviter?.name || inviter?.email || "Super Admin",
          role: role as SuperAdminRole,
        },
      });

      // Envoyer l'email d'invitation
      try {
        await sendInvitationEmail({
          email,
          token,
          inviteType: "admin",
          role: role,
          invitedByName: inviter?.name || inviter?.email || "Super Admin",
        });
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        // Ne pas échouer si l'email ne peut pas être envoyé, l'invitation est quand même créée
      }

      // Log d'audit
      await mainPrisma.adminAuditLog.create({
        data: {
          action: "CREATE",
          entityType: "AdminInvitation",
          entityId: invitation.id,
          description: `Invitation de ${email} comme ${role}`,
          adminUserId: session.user.id,
          metadata: { 
            email,
            role,
            invitationToken: token,
          },
        },
      });

      return NextResponse.json(
        { 
          success: true, 
          data: { 
            invitationId: invitation.id,
            email: invitation.email,
            role: invitation.role,
            message: "Invitation envoyée par email",
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


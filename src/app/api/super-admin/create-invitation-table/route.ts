import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";

// POST /api/super-admin/create-invitation-table - Créer la table AdminInvitation
export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent créer la table
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const mainPrisma = getMainPrisma();

    // Vérifier si la table existe déjà
    try {
      await mainPrisma.adminInvitation.count();
      return NextResponse.json({
        success: true,
        message: "La table AdminInvitation existe déjà",
        tableExists: true,
      });
    } catch (error) {
      // La table n'existe pas, on va la créer
    }

    // Créer la table via une requête SQL brute
    try {
      // Créer l'enum InvitationStatus
      await mainPrisma.$executeRawUnsafe(`
        DO $$ BEGIN
            CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `);

      // Créer la table AdminInvitation
      await mainPrisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AdminInvitation" (
            "id" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expiresAt" TIMESTAMP(3) NOT NULL,
            "email" TEXT NOT NULL,
            "token" TEXT NOT NULL,
            "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
            "acceptedAt" TIMESTAMP(3),
            "invitedBy" TEXT NOT NULL,
            "invitedByName" TEXT,
            "role" TEXT,
            "organizationId" TEXT,

            CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
        );
      `);

      // Créer les index
      await mainPrisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "AdminInvitation_email_idx" ON "AdminInvitation"("email");
        CREATE INDEX IF NOT EXISTS "AdminInvitation_status_idx" ON "AdminInvitation"("status");
        CREATE UNIQUE INDEX IF NOT EXISTS "AdminInvitation_token_key" ON "AdminInvitation"("token");
        CREATE INDEX IF NOT EXISTS "AdminInvitation_invitedBy_idx" ON "AdminInvitation"("invitedBy");
      `);

      // Ajouter les contraintes de clé étrangère
      await mainPrisma.$executeRawUnsafe(`
        DO $$ BEGIN
            ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `);

      await mainPrisma.$executeRawUnsafe(`
        DO $$ BEGIN
            ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `);

      // Vérifier que la table a été créée
      const count = await mainPrisma.adminInvitation.count();

      return NextResponse.json({
        success: true,
        message: "Table AdminInvitation créée avec succès",
        tableExists: true,
        invitationCount: count,
      });
    } catch (sqlError) {
      console.error("Erreur SQL lors de la création de la table:", sqlError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la création de la table",
          details: sqlError instanceof Error ? sqlError.message : String(sqlError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating invitation table:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création de la table",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


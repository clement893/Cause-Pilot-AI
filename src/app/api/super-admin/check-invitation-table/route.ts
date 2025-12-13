import { NextRequest, NextResponse } from "next/server";
import { getMainPrisma } from "@/lib/prisma-org";

// GET /api/super-admin/check-invitation-table - Vérifier si la table AdminInvitation existe
export async function GET(_request: NextRequest) {
  try {
    const mainPrisma = getMainPrisma();

    // Essayer de compter les invitations pour vérifier si la table existe
    try {
      const count = await mainPrisma.adminInvitation.count();
      return NextResponse.json({
        success: true,
        tableExists: true,
        invitationCount: count,
        message: "La table AdminInvitation existe et contient " + count + " invitation(s)",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("does not exist") || errorMessage.includes("Unknown model")) {
        return NextResponse.json({
          success: false,
          tableExists: false,
          error: "La table AdminInvitation n'existe pas dans la base de données",
          message: "Vous devez exécuter les migrations Prisma pour créer la table",
          instructions: [
            "1. Exécutez: pnpm prisma migrate deploy",
            "2. Ou: pnpm prisma db push",
            "3. Ou appliquez manuellement la migration dans Railway",
          ],
        }, { status: 404 });
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error checking invitation table:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Erreur lors de la vérification de la table",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


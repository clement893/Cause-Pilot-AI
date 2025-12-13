import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/promote-clement - Route temporaire pour promouvoir clement@nukleo.com
// Cette route peut être supprimée après utilisation
// Vous pouvez l'appeler directement depuis votre navigateur une fois déployé
export async function GET(_request: NextRequest) {
  try {
    const email = "clement@nukleo.com";

    console.log(`🔍 Recherche de ${email}...`);

    // Vérifier si l'utilisateur existe
    const user = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Utilisateur ${email} non trouvé`,
          message: "Vérifiez que l'utilisateur existe dans la base de données"
        },
        { status: 404 }
      );
    }

    console.log(`✅ Utilisateur trouvé:`, user);

    if (user.role === "SUPER_ADMIN" && user.status === "ACTIVE") {
      return NextResponse.json({
        success: true,
        message: `${email} est déjà Super Admin`,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }

    console.log(`🔄 Promotion de ${email} en SUPER_ADMIN...`);

    // Mettre à jour le rôle
    const updatedUser = await prisma.adminUser.update({
      where: { id: user.id },
      data: { 
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    console.log(`✅ Promotion réussie!`, updatedUser);

    return NextResponse.json({
      success: true,
      message: `✅ ${email} est maintenant Super Admin!`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      },
      previousRole: user.role,
      previousStatus: user.status,
      instructions: "Vous pouvez maintenant accéder à /super-admin/users et inviter des utilisateurs",
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Erreur lors de la promotion", 
        details: String(error),
        message: "Vérifiez les logs du serveur pour plus de détails"
      },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/promote-clement - Route temporaire pour promouvoir clement@nukleo.com
// Cette route peut être supprimée après utilisation
export async function POST(_request: NextRequest) {
  return GET(_request);
}


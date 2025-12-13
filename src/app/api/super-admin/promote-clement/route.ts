import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/super-admin/promote-clement - Route temporaire pour promouvoir clement@nukleo.com
// Cette route peut être supprimée après utilisation
export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const email = "clement@nukleo.com";

    // Vérifier si l'utilisateur existe
    const user = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: `Utilisateur ${email} non trouvé` },
        { status: 404 }
      );
    }

    // Mettre à jour le rôle
    const updatedUser = await prisma.adminUser.update({
      where: { id: user.id },
      data: { 
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${email} est maintenant Super Admin`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      },
      previousRole: user.role,
      previousStatus: user.status,
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la promotion", details: String(error) },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/super-admin/promote - Promouvoir l'utilisateur @nukleo.com en SUPER_ADMIN
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les utilisateurs @nukleo.com peuvent être promus
    if (!session.user.email.endsWith("@nukleo.com")) {
      return NextResponse.json(
        { success: false, error: "Seuls les utilisateurs @nukleo.com peuvent être super admin" },
        { status: 403 }
      );
    }

    // Mettre à jour le rôle
    const updatedUser = await prisma.adminUser.update({
      where: { id: session.user.id },
      data: { 
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vous êtes maintenant Super Admin",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la promotion" },
      { status: 500 }
    );
  }
}

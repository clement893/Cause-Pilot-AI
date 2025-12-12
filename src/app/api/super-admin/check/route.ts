import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Domaine autorisé pour l'accès super-admin
const ALLOWED_DOMAIN = "nukleo.com";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ isSuperAdmin: false });
    }

    // Vérifier le domaine de l'email
    const emailDomain = session.user.email.split("@")[1];
    if (emailDomain?.toLowerCase() !== ALLOWED_DOMAIN) {
      return NextResponse.json({ isSuperAdmin: false });
    }

    // Vérifier si l'utilisateur existe dans AdminUser et est actif
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
      select: { role: true, status: true },
    });

    if (!adminUser || adminUser.status !== "ACTIVE") {
      // Créer l'utilisateur admin s'il n'existe pas (pour les nouveaux utilisateurs @nukleo.com)
      if (!adminUser) {
        await prisma.adminUser.create({
          data: {
            email: session.user.email,
            name: session.user.name || session.user.email.split("@")[0],
            role: "ADMIN",
            status: "ACTIVE",
          },
        });
        return NextResponse.json({ isSuperAdmin: true, role: "ADMIN" });
      }
      return NextResponse.json({ isSuperAdmin: false });
    }

    return NextResponse.json({ 
      isSuperAdmin: true, 
      role: adminUser.role,
      isSuperAdminRole: adminUser.role === "SUPER_ADMIN"
    });
  } catch (error) {
    console.error("Erreur lors de la vérification super-admin:", error);
    return NextResponse.json({ isSuperAdmin: false });
  }
}

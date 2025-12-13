import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        hasSession: false,
        error: "Non authentifié",
      });
    }

    // Récupérer les détails complets de l'utilisateur
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    const isSuper = await isSuperAdmin(session.user.id);

    return NextResponse.json({
      success: true,
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      } : null,
      adminUser: adminUser,
      isSuperAdmin: isSuper,
      cookies: request.cookies.getAll().map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      hasSession: false,
    }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";

// Rôles statiques pour l'admin - les vrais rôles sont définis dans le schéma AdminUser
const ADMIN_ROLES = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "Accès complet à toutes les fonctionnalités",
    color: "#ef4444",
    isSystem: true,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Accès administrateur standard",
    color: "#f59e0b",
    isSystem: true,
  },
  {
    id: "support",
    name: "Support",
    description: "Accès support client",
    color: "#3b82f6",
    isSystem: true,
  },
];

// GET - Liste des rôles admin
export async function GET() {
  try {
    return NextResponse.json(ADMIN_ROLES);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rôles" },
      { status: 500 }
    );
  }
}

// POST - Les rôles admin sont définis statiquement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json(
      { 
        error: "Les rôles admin sont définis statiquement. Utilisez le champ 'role' de AdminUser pour assigner un rôle.",
        availableRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"],
        requestedData: body
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du rôle" },
      { status: 500 }
    );
  }
}

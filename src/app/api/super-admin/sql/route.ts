import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";

// POST /api/super-admin/sql - Exécuter une requête SQL
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent exécuter du SQL
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé. Seuls les super admins peuvent exécuter du SQL." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: "La requête SQL est requise" },
        { status: 400 }
      );
    }

    // Sécurité : Bloquer les opérations dangereuses
    const dangerousKeywords = ['DROP DATABASE', 'DROP SCHEMA', 'TRUNCATE', 'DELETE FROM'];
    const upperQuery = query.toUpperCase();
    
    // Permettre TRUNCATE et DELETE seulement si explicitement autorisé
    const isDangerous = dangerousKeywords.some(keyword => upperQuery.includes(keyword));
    
    if (isDangerous && !body.allowDangerous) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Opération potentiellement dangereuse détectée. Ajoutez 'allowDangerous: true' si vous êtes sûr.",
          detectedKeywords: dangerousKeywords.filter(k => upperQuery.includes(k))
        },
        { status: 400 }
      );
    }

    const mainPrisma = getMainPrisma();

    try {
      // Exécuter la requête SQL
      const result = await mainPrisma.$queryRawUnsafe(query);
      
      // Si c'est une requête SELECT, retourner les résultats
      if (upperQuery.trim().startsWith('SELECT')) {
        return NextResponse.json({
          success: true,
          data: result,
          rowCount: Array.isArray(result) ? result.length : 0,
        });
      }
      
      // Pour les autres requêtes (CREATE, ALTER, etc.), retourner un message de succès
      return NextResponse.json({
        success: true,
        message: "Requête exécutée avec succès",
        data: result,
      });
    } catch (sqlError) {
      console.error("Erreur SQL:", sqlError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'exécution de la requête SQL",
          details: sqlError instanceof Error ? sqlError.message : String(sqlError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error executing SQL:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'exécution de la requête SQL",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


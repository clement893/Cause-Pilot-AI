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
      // Diviser les requêtes multiples par point-virgule
      // Mais garder les blocs DO $$ ... END $$; intacts
      const queries: string[] = [];
      let currentQuery = '';
      let inDoBlock = false;
      let doBlockDepth = 0;
      
      const lines = query.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        const upperLine = trimmedLine.toUpperCase();
        
        // Détecter le début d'un bloc DO $$
        if (upperLine.startsWith('DO $$')) {
          inDoBlock = true;
          doBlockDepth = 1;
        }
        
        // Compter les BEGIN et END dans les blocs DO
        if (inDoBlock) {
          doBlockDepth += (upperLine.match(/\bBEGIN\b/g) || []).length;
          doBlockDepth -= (upperLine.match(/\bEND\b/g) || []).length;
        }
        
        currentQuery += line + '\n';
        
        // Si on est dans un bloc DO et qu'on trouve END $$, c'est la fin
        if (inDoBlock && upperLine.includes('END $$')) {
          inDoBlock = false;
          doBlockDepth = 0;
        }
        
        // Si on n'est pas dans un bloc DO et qu'on trouve un point-virgule, c'est la fin d'une requête
        if (!inDoBlock && trimmedLine.endsWith(';') && doBlockDepth === 0) {
          const queryToAdd = currentQuery.trim();
          if (queryToAdd) {
            queries.push(queryToAdd);
          }
          currentQuery = '';
        }
      }
      
      // Ajouter la dernière requête si elle existe
      if (currentQuery.trim()) {
        queries.push(currentQuery.trim());
      }
      
      if (queries.length === 0) {
        return NextResponse.json(
          { success: false, error: "Aucune requête SQL valide trouvée" },
          { status: 400 }
        );
      }
      
      const results: unknown[] = [];
      let lastResult: unknown = null;
      
      // Exécuter chaque requête séparément
      for (let i = 0; i < queries.length; i++) {
        const singleQuery = queries[i];
        const upperSingleQuery = singleQuery.trim().toUpperCase();
        
        try {
          if (upperSingleQuery.startsWith('SELECT')) {
            // Utiliser $queryRawUnsafe pour SELECT
            const result = await mainPrisma.$queryRawUnsafe(singleQuery);
            lastResult = result;
            results.push(result);
          } else {
            // Utiliser $executeRawUnsafe pour CREATE, ALTER, INSERT, UPDATE, DELETE, etc.
            const result = await mainPrisma.$executeRawUnsafe(singleQuery);
            lastResult = { affectedRows: result };
            results.push({ affectedRows: result });
          }
        } catch (queryError) {
          console.error(`Erreur dans la requête ${i + 1}/${queries.length}:`, queryError);
          throw new Error(
            `Erreur dans la requête ${i + 1}/${queries.length}: ${queryError instanceof Error ? queryError.message : String(queryError)}`
          );
        }
      }
      
      // Si c'est une requête SELECT, retourner les résultats
      if (upperQuery.trim().startsWith('SELECT')) {
        return NextResponse.json({
          success: true,
          data: lastResult,
          rowCount: Array.isArray(lastResult) ? lastResult.length : 0,
          executedQueries: queries.length,
        });
      }
      
      // Pour les autres requêtes (CREATE, ALTER, etc.), retourner un message de succès
      return NextResponse.json({
        success: true,
        message: `${queries.length} requête(s) exécutée(s) avec succès`,
        data: results,
        executedQueries: queries.length,
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


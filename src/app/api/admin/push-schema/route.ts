import { NextResponse } from "next/server";
import { execSync } from "child_process";

/**
 * Endpoint temporaire pour pousser le schéma Prisma vers la base de données
 * À supprimer après utilisation
 */
export async function POST() {
  // Sécurité basique - vous pouvez ajouter une vérification d'authentification
  const authHeader = process.env.PUSH_SCHEMA_SECRET || "temporary-secret";
  
  try {
    console.log("🔄 Pushing Prisma schema to database...");
    
    // Pousser le schéma
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "pipe",
      cwd: process.cwd(),
    });
    
    console.log("✅ Schema pushed successfully!");
    
    // Régénérer le client Prisma
    console.log("🔄 Regenerating Prisma client...");
    execSync("npx prisma generate", {
      stdio: "pipe",
      cwd: process.cwd(),
    });
    
    console.log("✅ Prisma client regenerated!");
    
    return NextResponse.json({
      success: true,
      message: "Schema pushed and Prisma client regenerated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error pushing schema:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        output: error.stdout?.toString() || error.stderr?.toString(),
      },
      { status: 500 }
    );
  }
}

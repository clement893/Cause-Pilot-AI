import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

console.log("🔄 Pushing Prisma schema to database...");

try {
  // Utiliser prisma db push via execSync
  execSync("npx prisma db push --accept-data-loss", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  console.log("✅ Schema pushed successfully!");
  
  // Régénérer le client Prisma
  console.log("🔄 Regenerating Prisma client...");
  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  console.log("✅ Prisma client regenerated!");
} catch (error) {
  console.error("❌ Error pushing schema:", error);
  process.exit(1);
}

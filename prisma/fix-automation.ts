import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixAutomation() {
  console.log("🔧 Fix des champs id et updatedAt pour Automation...\n");

  try {
    // Fix Automation
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Automation" 
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Automation" 
      ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log("✅ Automation fixé");
  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAutomation()
  .then(() => {
    console.log("\n🎉 Fix terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fix échoué:", error);
    process.exit(1);
  });

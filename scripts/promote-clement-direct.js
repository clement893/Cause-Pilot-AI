// Script simple pour promouvoir clement@nukleo.com en SUPER_ADMIN
// Exécutez avec: node scripts/promote-clement-direct.js

const { PrismaClient } = require("@prisma/client");

const databaseUrl = "postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function promoteClement() {
  try {
    console.log("🔍 Recherche de clement@nukleo.com...");
    
    const user = await prisma.adminUser.findUnique({
      where: { email: "clement@nukleo.com" },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      console.error("❌ Utilisateur clement@nukleo.com non trouvé dans la base de données");
      console.log("💡 Vérifiez que l'utilisateur existe dans la table AdminUser");
      return;
    }

    console.log("✅ Utilisateur trouvé:");
    console.log("   - ID:", user.id);
    console.log("   - Email:", user.email);
    console.log("   - Rôle actuel:", user.role);
    console.log("   - Statut actuel:", user.status);

    if (user.role === "SUPER_ADMIN" && user.status === "ACTIVE") {
      console.log("✅ L'utilisateur est déjà SUPER_ADMIN et ACTIVE");
      return;
    }

    console.log("\n🔄 Promotion en cours...");

    const updatedUser = await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    console.log("\n✅ Promotion réussie!");
    console.log("   - Nouveau rôle:", updatedUser.role);
    console.log("   - Nouveau statut:", updatedUser.status);
    console.log("\n🎉 clement@nukleo.com est maintenant Super Admin!");
    
  } catch (error) {
    console.error("\n❌ Erreur:", error.message);
    if (error.code) {
      console.error("   Code d'erreur:", error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Connexion fermée");
  }
}

promoteClement();


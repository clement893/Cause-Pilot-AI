const { PrismaClient } = require("@prisma/client");

// Utiliser la même configuration que le projet
const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL || "postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function promoteToSuperAdmin(email) {
  try {
    console.log(`Recherche de l'utilisateur avec l'email: ${email}`);
    
    const user = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      console.error(`❌ Utilisateur avec l'email ${email} non trouvé`);
      return;
    }

    console.log(`Utilisateur trouvé:`, user);

    const updatedUser = await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    console.log(`✅ Utilisateur promu en SUPER_ADMIN:`, {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
    });
  } catch (error) {
    console.error("Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2] || "clement@nukleo.com";

console.log(`Promotion de ${email} en SUPER_ADMIN...`);
promoteToSuperAdmin(email);


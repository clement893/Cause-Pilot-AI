import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Permissions par défaut du système
const DEFAULT_PERMISSIONS = [
  // Module Donateurs
  { code: "donors.view", name: "Voir les donateurs", module: "donors" },
  { code: "donors.create", name: "Créer des donateurs", module: "donors" },
  { code: "donors.edit", name: "Modifier les donateurs", module: "donors" },
  { code: "donors.delete", name: "Supprimer des donateurs", module: "donors" },
  { code: "donors.export", name: "Exporter les donateurs", module: "donors" },
  { code: "donors.import", name: "Importer des donateurs", module: "donors" },

  // Module Campagnes
  { code: "campaigns.view", name: "Voir les campagnes", module: "campaigns" },
  { code: "campaigns.create", name: "Créer des campagnes", module: "campaigns" },
  { code: "campaigns.edit", name: "Modifier les campagnes", module: "campaigns" },
  { code: "campaigns.delete", name: "Supprimer des campagnes", module: "campaigns" },

  // Module Formulaires
  { code: "forms.view", name: "Voir les formulaires", module: "forms" },
  { code: "forms.create", name: "Créer des formulaires", module: "forms" },
  { code: "forms.edit", name: "Modifier les formulaires", module: "forms" },
  { code: "forms.delete", name: "Supprimer des formulaires", module: "forms" },
  { code: "forms.publish", name: "Publier des formulaires", module: "forms" },

  // Module Marketing
  { code: "marketing.view", name: "Voir le marketing", module: "marketing" },
  { code: "marketing.create", name: "Créer des campagnes email", module: "marketing" },
  { code: "marketing.edit", name: "Modifier les campagnes email", module: "marketing" },
  { code: "marketing.send", name: "Envoyer des emails", module: "marketing" },

  // Module Analytics
  { code: "analytics.view", name: "Voir les analytics", module: "analytics" },
  { code: "analytics.export", name: "Exporter les rapports", module: "analytics" },

  // Module P2P
  { code: "p2p.view", name: "Voir les campagnes P2P", module: "p2p" },
  { code: "p2p.manage", name: "Gérer les campagnes P2P", module: "p2p" },
  { code: "p2p.approve", name: "Approuver les fundraisers", module: "p2p" },

  // Module Copilote IA
  { code: "copilot.use", name: "Utiliser le copilote IA", module: "copilot" },

  // Module Administration
  { code: "admin.users.view", name: "Voir les utilisateurs", module: "admin" },
  { code: "admin.users.manage", name: "Gérer les utilisateurs", module: "admin" },
  { code: "admin.roles.view", name: "Voir les rôles", module: "admin" },
  { code: "admin.roles.manage", name: "Gérer les rôles", module: "admin" },
  { code: "admin.settings.view", name: "Voir les paramètres", module: "admin" },
  { code: "admin.settings.edit", name: "Modifier les paramètres", module: "admin" },
  { code: "admin.audit.view", name: "Voir le journal d'audit", module: "admin" },
  { code: "admin.integrations.manage", name: "Gérer les intégrations", module: "admin" },
];

// GET - Liste des permissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleFilter = searchParams.get("module");

    const where: Record<string, unknown> = {};
    if (moduleFilter) {
      where.module = moduleFilter;
    }

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });

    // Grouper par module
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return NextResponse.json({
      permissions,
      grouped,
      modules: Object.keys(grouped),
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des permissions" },
      { status: 500 }
    );
  }
}

// POST - Initialiser les permissions par défaut
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "seed") {
      // Créer les permissions par défaut si elles n'existent pas
      for (const perm of DEFAULT_PERMISSIONS) {
        await prisma.permission.upsert({
          where: { code: perm.code },
          update: { name: perm.name, module: perm.module },
          create: perm,
        });
      }

      // Créer les rôles par défaut
      const adminRole = await prisma.role.upsert({
        where: { name: "Administrateur" },
        update: {},
        create: {
          name: "Administrateur",
          description: "Accès complet à toutes les fonctionnalités",
          isSystem: true,
          color: "#dc2626",
        },
      });

      const managerRole = await prisma.role.upsert({
        where: { name: "Gestionnaire" },
        update: {},
        create: {
          name: "Gestionnaire",
          description: "Gestion des campagnes et donateurs",
          isSystem: true,
          color: "#2563eb",
        },
      });

      const analystRole = await prisma.role.upsert({
        where: { name: "Analyste" },
        update: {},
        create: {
          name: "Analyste",
          description: "Consultation et analyse des données",
          isSystem: true,
          color: "#16a34a",
        },
      });

      const viewerRole = await prisma.role.upsert({
        where: { name: "Lecteur" },
        update: {},
        create: {
          name: "Lecteur",
          description: "Consultation uniquement",
          isSystem: true,
          color: "#6b7280",
        },
      });

      // Assigner toutes les permissions à l'admin
      const allPermissions = await prisma.permission.findMany();
      for (const perm of allPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        });
      }

      // Permissions pour le gestionnaire (tout sauf admin)
      const managerPermissions = allPermissions.filter(
        (p) => !p.code.startsWith("admin.")
      );
      for (const perm of managerPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: managerRole.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: managerRole.id,
            permissionId: perm.id,
          },
        });
      }

      // Permissions pour l'analyste (view + analytics)
      const analystPermissions = allPermissions.filter(
        (p) => p.code.includes(".view") || p.module === "analytics" || p.module === "copilot"
      );
      for (const perm of analystPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: analystRole.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: analystRole.id,
            permissionId: perm.id,
          },
        });
      }

      // Permissions pour le lecteur (view uniquement)
      const viewerPermissions = allPermissions.filter((p) =>
        p.code.includes(".view")
      );
      for (const perm of viewerPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: viewerRole.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: viewerRole.id,
            permissionId: perm.id,
          },
        });
      }

      return NextResponse.json({
        message: "Permissions et rôles initialisés avec succès",
        permissions: DEFAULT_PERMISSIONS.length,
        roles: 4,
      });
    }

    return NextResponse.json(
      { error: "Action non reconnue" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error seeding permissions:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation des permissions" },
      { status: 500 }
    );
  }
}

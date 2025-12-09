import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Paramètres par défaut du système
const DEFAULT_SETTINGS = [
  // Organisation
  { key: "org.name", value: "Mon Organisation", category: "organization", label: "Nom de l'organisation", dataType: "STRING" },
  { key: "org.logo", value: "", category: "organization", label: "Logo", dataType: "URL" },
  { key: "org.website", value: "", category: "organization", label: "Site web", dataType: "URL" },
  { key: "org.email", value: "", category: "organization", label: "Email de contact", dataType: "EMAIL" },
  { key: "org.phone", value: "", category: "organization", label: "Téléphone", dataType: "STRING" },
  { key: "org.address", value: "", category: "organization", label: "Adresse", dataType: "STRING" },
  { key: "org.taxId", value: "", category: "organization", label: "Numéro d'enregistrement fiscal", dataType: "STRING" },

  // Email
  { key: "email.senderName", value: "Mon Organisation", category: "email", label: "Nom de l'expéditeur", dataType: "STRING" },
  { key: "email.senderEmail", value: "noreply@example.com", category: "email", label: "Email de l'expéditeur", dataType: "EMAIL" },
  { key: "email.replyTo", value: "", category: "email", label: "Email de réponse", dataType: "EMAIL" },
  { key: "email.footer", value: "", category: "email", label: "Pied de page des emails", dataType: "STRING" },

  // Dons
  { key: "donations.currency", value: "CAD", category: "donations", label: "Devise par défaut", dataType: "SELECT", options: JSON.stringify(["CAD", "USD", "EUR"]) },
  { key: "donations.minAmount", value: "5", category: "donations", label: "Montant minimum", dataType: "NUMBER" },
  { key: "donations.suggestedAmounts", value: "[25, 50, 100, 250, 500]", category: "donations", label: "Montants suggérés", dataType: "JSON" },
  { key: "donations.receiptPrefix", value: "DON", category: "donations", label: "Préfixe des reçus", dataType: "STRING" },

  // Sécurité
  { key: "security.sessionTimeout", value: "3600", category: "security", label: "Timeout de session (secondes)", dataType: "NUMBER" },
  { key: "security.maxLoginAttempts", value: "5", category: "security", label: "Tentatives de connexion max", dataType: "NUMBER" },
  { key: "security.requireMfa", value: "false", category: "security", label: "Exiger 2FA", dataType: "BOOLEAN" },
  { key: "security.passwordMinLength", value: "8", category: "security", label: "Longueur min du mot de passe", dataType: "NUMBER" },

  // Notifications
  { key: "notifications.newDonation", value: "true", category: "notifications", label: "Notification nouveau don", dataType: "BOOLEAN" },
  { key: "notifications.goalReached", value: "true", category: "notifications", label: "Notification objectif atteint", dataType: "BOOLEAN" },
  { key: "notifications.newFundraiser", value: "true", category: "notifications", label: "Notification nouveau fundraiser", dataType: "BOOLEAN" },

  // Apparence
  { key: "appearance.primaryColor", value: "#6366f1", category: "appearance", label: "Couleur principale", dataType: "COLOR" },
  { key: "appearance.accentColor", value: "#ec4899", category: "appearance", label: "Couleur d'accent", dataType: "COLOR" },
  { key: "appearance.darkMode", value: "true", category: "appearance", label: "Mode sombre par défaut", dataType: "BOOLEAN" },
];

// GET - Liste des paramètres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Grouper par catégorie
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      // Masquer les valeurs secrètes
      const value = setting.isSecret ? "********" : setting.value;
      acc[setting.category].push({ ...setting, value });
      return acc;
    }, {} as Record<string, typeof settings>);

    return NextResponse.json({
      settings,
      grouped,
      categories: Object.keys(grouped),
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    );
  }
}

// POST - Initialiser ou mettre à jour les paramètres
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "seed") {
      // Créer les paramètres par défaut
      for (const setting of DEFAULT_SETTINGS) {
        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {},
          create: {
            key: setting.key,
            value: setting.value,
            category: setting.category,
            label: setting.label,
            dataType: setting.dataType as "STRING" | "NUMBER" | "BOOLEAN" | "JSON" | "EMAIL" | "URL" | "COLOR" | "SELECT",
            options: (setting as { options?: string }).options || null,
          },
        });
      }

      return NextResponse.json({
        message: "Paramètres initialisés avec succès",
        count: DEFAULT_SETTINGS.length,
      });
    }

    return NextResponse.json(
      { error: "Action non reconnue" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error seeding settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation des paramètres" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour des paramètres
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body; // Array de { key, value }

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: "Format invalide" },
        { status: 400 }
      );
    }

    const updated = [];
    for (const { key, value } of settings) {
      const setting = await prisma.systemSetting.findUnique({
        where: { key },
      });

      if (!setting) {
        continue;
      }

      if (setting.isReadOnly) {
        continue;
      }

      const updatedSetting = await prisma.systemSetting.update({
        where: { key },
        data: { value: String(value) },
      });

      updated.push(updatedSetting);

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          userId: 1,
          action: "SETTINGS_CHANGE",
          module: "admin",
          entityType: "SystemSetting",
          entityId: key,
          description: `Modification du paramètre ${key}`,
          oldValue: setting.value,
          newValue: String(value),
        },
      });
    }

    return NextResponse.json({
      message: "Paramètres mis à jour",
      updated: updated.length,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des paramètres" },
      { status: 500 }
    );
  }
}

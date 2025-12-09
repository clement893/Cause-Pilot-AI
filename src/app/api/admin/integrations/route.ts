import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Intégrations disponibles
const AVAILABLE_INTEGRATIONS = [
  {
    provider: "stripe",
    name: "Stripe",
    description: "Traitement des paiements par carte de crédit",
    category: "PAYMENT",
    logoUrl: "https://stripe.com/img/v3/home/twitter.png",
    docsUrl: "https://stripe.com/docs",
  },
  {
    provider: "paypal",
    name: "PayPal",
    description: "Paiements via PayPal",
    category: "PAYMENT",
    logoUrl: "https://www.paypalobjects.com/webstatic/icon/pp258.png",
    docsUrl: "https://developer.paypal.com/docs",
  },
  {
    provider: "mailchimp",
    name: "Mailchimp",
    description: "Marketing par email et automatisation",
    category: "EMAIL",
    logoUrl: "https://mailchimp.com/release/plums/cxp/images/freddie.png",
    docsUrl: "https://mailchimp.com/developer/",
  },
  {
    provider: "sendgrid",
    name: "SendGrid",
    description: "Envoi d'emails transactionnels",
    category: "EMAIL",
    logoUrl: "https://sendgrid.com/brand/sg-logo-300.png",
    docsUrl: "https://docs.sendgrid.com/",
  },
  {
    provider: "salesforce",
    name: "Salesforce",
    description: "CRM et gestion de la relation client",
    category: "CRM",
    logoUrl: "https://www.salesforce.com/content/dam/sfdc-docs/www/logos/logo-salesforce.svg",
    docsUrl: "https://developer.salesforce.com/docs",
  },
  {
    provider: "hubspot",
    name: "HubSpot",
    description: "CRM et marketing automation",
    category: "CRM",
    logoUrl: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png",
    docsUrl: "https://developers.hubspot.com/docs",
  },
  {
    provider: "quickbooks",
    name: "QuickBooks",
    description: "Comptabilité et facturation",
    category: "ACCOUNTING",
    logoUrl: "https://quickbooks.intuit.com/etc/designs/quickbooks/clientlibs/img/qb-logo.svg",
    docsUrl: "https://developer.intuit.com/app/developer/qbo/docs",
  },
  {
    provider: "google_analytics",
    name: "Google Analytics",
    description: "Analyse du trafic web",
    category: "ANALYTICS",
    logoUrl: "https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg",
    docsUrl: "https://developers.google.com/analytics",
  },
  {
    provider: "facebook",
    name: "Facebook",
    description: "Partage et publicité sur Facebook",
    category: "SOCIAL",
    logoUrl: "https://static.xx.fbcdn.net/rsrc.php/yD/r/d4ZIVX-5C-b.ico",
    docsUrl: "https://developers.facebook.com/docs",
  },
];

// GET - Liste des intégrations
export async function GET() {
  try {
    const integrations = await prisma.integration.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Fusionner avec les intégrations disponibles
    const allIntegrations = AVAILABLE_INTEGRATIONS.map((available) => {
      const existing = integrations.find((i) => i.provider === available.provider);
      return {
        ...available,
        id: existing?.id || null,
        isEnabled: existing?.isEnabled || false,
        isConfigured: existing?.isConfigured || false,
        lastSyncAt: existing?.lastSyncAt || null,
        lastSyncStatus: existing?.lastSyncStatus || null,
      };
    });

    // Grouper par catégorie
    const grouped = allIntegrations.reduce((acc, integration) => {
      if (!acc[integration.category]) {
        acc[integration.category] = [];
      }
      acc[integration.category].push(integration);
      return acc;
    }, {} as Record<string, typeof allIntegrations>);

    return NextResponse.json({
      integrations: allIntegrations,
      grouped,
      categories: Object.keys(grouped),
    });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des intégrations" },
      { status: 500 }
    );
  }
}

// POST - Configurer une intégration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, config } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Le provider est requis" },
        { status: 400 }
      );
    }

    const availableIntegration = AVAILABLE_INTEGRATIONS.find(
      (i) => i.provider === provider
    );

    if (!availableIntegration) {
      return NextResponse.json(
        { error: "Intégration non reconnue" },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.upsert({
      where: { provider },
      update: {
        config: config ? JSON.stringify(config) : null,
        isConfigured: !!config,
        isEnabled: !!config,
      },
      create: {
        provider,
        name: availableIntegration.name,
        description: availableIntegration.description,
        category: availableIntegration.category as "PAYMENT" | "EMAIL" | "CRM" | "ACCOUNTING" | "SOCIAL" | "ANALYTICS" | "OTHER",
        logoUrl: availableIntegration.logoUrl,
        docsUrl: availableIntegration.docsUrl,
        config: config ? JSON.stringify(config) : null,
        isConfigured: !!config,
        isEnabled: !!config,
      },
    });

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: 1,
        action: "SETTINGS_CHANGE",
        module: "admin",
        entityType: "Integration",
        entityId: integration.id,
        description: `Configuration de l'intégration ${provider}`,
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error configuring integration:", error);
    return NextResponse.json(
      { error: "Erreur lors de la configuration de l'intégration" },
      { status: 500 }
    );
  }
}

// PATCH - Activer/Désactiver une intégration
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, isEnabled } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Le provider est requis" },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.update({
      where: { provider },
      data: { isEnabled },
    });

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: 1,
        action: "SETTINGS_CHANGE",
        module: "admin",
        entityType: "Integration",
        entityId: integration.id,
        description: `${isEnabled ? "Activation" : "Désactivation"} de l'intégration ${provider}`,
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error toggling integration:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'intégration" },
      { status: 500 }
    );
  }
}

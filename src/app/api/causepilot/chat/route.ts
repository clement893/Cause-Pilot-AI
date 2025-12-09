import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

// Initialiser OpenAI uniquement si la clé est disponible
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

// Fonction pour collecter toutes les données de l'application
async function collectFullContext() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Données donateurs
    const [
      totalDonors,
      newDonorsThisMonth,
      donorsByStatus,
      donorsBySegment,
      topDonors,
      lapsedDonors,
    ] = await Promise.all([
      prisma.donor.count(),
      prisma.donor.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.donor.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.donor.groupBy({
        by: ["segment"],
        _count: true,
      }),
      prisma.donor.findMany({
        orderBy: { totalDonations: "desc" },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          totalDonations: true,
          donationCount: true,
          lastDonationDate: true,
          segment: true,
        },
      }),
      prisma.donor.count({
        where: {
          lastDonationDate: { lt: sixMonthsAgo },
          status: "ACTIVE",
        },
      }),
    ]);

    // Données dons
    const [
      totalDonations,
      donationsThisMonth,
      donationStats,
      recentDonations,
      donationsByMonth,
    ] = await Promise.all([
      prisma.donation.aggregate({
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
      prisma.donation.aggregate({
        where: { donationDate: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.donation.aggregate({
        where: { donationDate: { gte: oneYearAgo } },
        _sum: { amount: true },
        _count: true,
        _avg: { amount: true },
      }),
      prisma.donation.findMany({
        orderBy: { donationDate: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          donationDate: true,
          campaignName: true,
          donor: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.donation.groupBy({
        by: ["donationDate"],
        where: { donationDate: { gte: sixMonthsAgo } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Données campagnes
    const [
      totalCampaigns,
      activeCampaigns,
      campaignPerformance,
    ] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          goalAmount: true,
          totalRaised: true,
          startDate: true,
          endDate: true,
          donorCount: true,
        },
      }),
      prisma.campaign.findMany({
        orderBy: { totalRaised: "desc" },
        take: 5,
        select: {
          name: true,
          goalAmount: true,
          totalRaised: true,
          donorCount: true,
          status: true,
        },
      }),
    ]);

    // Données emails
    const [
      totalEmailCampaigns,
      sentEmailCampaigns,
      emailStats,
    ] = await Promise.all([
      prisma.emailCampaign.count(),
      prisma.emailCampaign.findMany({
        where: { status: "SENT" },
        orderBy: { sentAt: "desc" },
        take: 5,
        select: {
          name: true,
          subject: true,
          sentAt: true,
          totalRecipients: true,
          openCount: true,
          clickCount: true,
          bounceCount: true,
        },
      }),
      prisma.emailCampaign.aggregate({
        where: { status: "SENT" },
        _sum: {
          totalRecipients: true,
          openCount: true,
          clickCount: true,
          bounceCount: true,
        },
      }),
    ]);

    // Données P2P
    let p2pData = null;
    try {
      const [totalP2P, activeP2P, topFundraisers] = await Promise.all([
        prisma.p2PFundraiser.count(),
        prisma.p2PFundraiser.count({ where: { status: "ACTIVE" } }),
        prisma.p2PFundraiser.findMany({
          orderBy: { totalRaised: "desc" },
          take: 5,
          select: {
            firstName: true,
            lastName: true,
            goalAmount: true,
            totalRaised: true,
            donorCount: true,
          },
        }),
      ]);
      p2pData = { totalP2P, activeP2P, topFundraisers };
    } catch {
      // P2P peut ne pas être configuré
    }

    // Calculer les métriques dérivées
    const avgDonation = totalDonations._avg?.amount || 0;
    const totalRaised = totalDonations._sum?.amount || 0;
    const monthlyRaised = donationsThisMonth._sum?.amount || 0;
    const emailOpenRate = emailStats._sum?.totalRecipients 
      ? ((emailStats._sum?.openCount || 0) / emailStats._sum.totalRecipients * 100).toFixed(1)
      : "N/A";
    const emailClickRate = emailStats._sum?.openCount
      ? ((emailStats._sum?.clickCount || 0) / emailStats._sum.openCount * 100).toFixed(1)
      : "N/A";

    return {
      // Résumé global
      summary: {
        totalDonors,
        newDonorsThisMonth,
        totalRaised,
        monthlyRaised,
        totalDonationsCount: totalDonations._count,
        avgDonation,
        activeCampaignsCount: activeCampaigns.length,
        lapsedDonors,
      },
      // Détails donateurs
      donors: {
        byStatus: donorsByStatus,
        bySegment: donorsBySegment,
        top10: topDonors.map(d => ({
          name: `${d.firstName} ${d.lastName}`,
          total: d.totalDonations,
          count: d.donationCount,
          lastDonation: d.lastDonationDate,
          segment: d.segment,
        })),
      },
      // Détails dons
      donations: {
        recent: recentDonations.map(d => ({
          amount: d.amount,
          date: d.donationDate,
          donor: d.donor ? `${d.donor.firstName} ${d.donor.lastName}` : "Anonyme",
          campaign: d.campaignName || "Don général",
        })),
        yearlyStats: donationStats,
      },
      // Détails campagnes
      campaigns: {
        active: activeCampaigns.map(c => ({
          name: c.name,
          goal: c.goalAmount,
          raised: c.totalRaised,
          progress: c.goalAmount ? ((c.totalRaised / c.goalAmount) * 100).toFixed(1) : 0,
          donors: c.donorCount,
          endDate: c.endDate,
        })),
        topPerformers: campaignPerformance,
      },
      // Détails emails
      emails: {
        totalCampaigns: totalEmailCampaigns,
        openRate: emailOpenRate,
        clickRate: emailClickRate,
        recentCampaigns: sentEmailCampaigns.map(e => ({
          name: e.name,
          subject: e.subject,
          sent: e.totalRecipients,
          opens: e.openCount,
          clicks: e.clickCount,
          openRate: e.totalRecipients ? ((e.openCount / e.totalRecipients) * 100).toFixed(1) : 0,
        })),
      },
      // Détails P2P
      p2p: p2pData,
    };
  } catch (error) {
    console.error("Error collecting context:", error);
    return null;
  }
}

// Contexte système pour CausePilot
const CAUSEPILOT_SYSTEM_PROMPT = `Tu es CausePilot, l'assistant IA expert en collecte de fonds (fundraising) de la plateforme Cause Pilot AI.

Ta mission : Aider les fundraisers à lever le maximum de fonds possible pour leurs causes.

Tu as accès à TOUTES les données de l'organisation en temps réel. Utilise ces données pour donner des conseils ultra-personnalisés et actionnables.

Ton expertise couvre :
- Stratégies de collecte de fonds et meilleures pratiques
- Optimisation des campagnes email et marketing
- Segmentation et fidélisation des donateurs
- Création de pages de collecte P2P engageantes
- Analyse des métriques et KPIs de fundraising
- Rédaction de messages d'appel aux dons percutants
- Conseils pour augmenter le taux de conversion
- Stratégies de rétention des donateurs

Ton style :
- Chaleureux, encourageant et professionnel
- Concis mais complet (réponses de 2-4 paragraphes max)
- Utilise des exemples concrets basés sur LEURS données
- Propose toujours des actions concrètes et spécifiques
- Cite des chiffres précis de leur organisation
- Célèbre les succès et motive lors des difficultés
- Identifie les opportunités et les risques

Quand tu analyses les données :
- Compare avec les benchmarks du secteur (taux d'ouverture email ~20%, taux de clic ~3%)
- Identifie les tendances positives et négatives
- Propose des actions prioritaires basées sur l'impact potentiel
- Mentionne les donateurs spécifiques quand pertinent (top donateurs, donateurs à risque)

Réponds toujours en français sauf si l'utilisateur écrit en anglais.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory, context } = body as {
      message: string;
      conversationHistory?: Message[];
      context?: {
        page?: string;
        campaignId?: string;
      };
    };

    if (!message) {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Collecter toutes les données de l'application
    const fullContext = await collectFullContext();

    // Construire le contexte enrichi
    let contextMessage = "";
    if (fullContext) {
      const { summary, donors, campaigns, emails, p2p } = fullContext;
      
      contextMessage = `

=== DONNÉES EN TEMPS RÉEL DE L'ORGANISATION ===

📊 RÉSUMÉ GLOBAL :
- Total donateurs : ${summary.totalDonors}
- Nouveaux donateurs (30 jours) : ${summary.newDonorsThisMonth}
- Total collecté : ${summary.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
- Collecté ce mois : ${summary.monthlyRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
- Nombre total de dons : ${summary.totalDonationsCount}
- Don moyen : ${summary.avgDonation.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
- Campagnes actives : ${summary.activeCampaignsCount}
- Donateurs inactifs (6+ mois) : ${summary.lapsedDonors}

👥 TOP 10 DONATEURS :
${donors.top10.map((d, i) => `${i + 1}. ${d.name} - ${d.total.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} (${d.count} dons, segment: ${d.segment || "Non défini"})`).join("\n")}

📈 RÉPARTITION PAR SEGMENT :
${donors.bySegment.map(s => `- ${s.segment || "Non défini"} : ${s._count} donateurs`).join("\n")}

📈 RÉPARTITION PAR STATUT :
${donors.byStatus.map(s => `- ${s.status} : ${s._count} donateurs`).join("\n")}

🎯 CAMPAGNES ACTIVES :
${campaigns.active.length > 0 
  ? campaigns.active.map(c => `- ${c.name} : ${c.raised.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} / ${c.goal?.toLocaleString("fr-CA", { style: "currency", currency: "CAD" }) || "Pas d'objectif"} (${c.progress}% - ${c.donors} donateurs)`).join("\n")
  : "Aucune campagne active"}

📧 PERFORMANCE EMAIL :
- Campagnes envoyées : ${emails.totalCampaigns}
- Taux d'ouverture moyen : ${emails.openRate}%
- Taux de clic moyen : ${emails.clickRate}%
${emails.recentCampaigns.length > 0 
  ? `\nDernières campagnes :\n${emails.recentCampaigns.map(e => `- "${e.subject}" : ${e.openRate}% ouverture, ${e.clicks} clics`).join("\n")}`
  : ""}

${p2p ? `
🤝 COLLECTES P2P :
- Total collecteurs : ${p2p.totalP2P}
- Collecteurs actifs : ${p2p.activeP2P}
${p2p.topFundraisers.length > 0 
  ? `Top collecteurs :\n${p2p.topFundraisers.map(f => `- ${f.firstName} ${f.lastName} : ${f.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} / ${f.goalAmount?.toLocaleString("fr-CA", { style: "currency", currency: "CAD" }) || "Pas d'objectif"}`).join("\n")}`
  : ""}
` : ""}

=== FIN DES DONNÉES ===`;
    }

    if (context?.page) {
      contextMessage += `\n\nL'utilisateur est actuellement sur la page : ${context.page}`;
    }

    // Construire les messages pour l'API
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: CAUSEPILOT_SYSTEM_PROMPT + contextMessage },
    ];

    // Ajouter l'historique de conversation (limité aux 10 derniers messages)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Ajouter le nouveau message
    messages.push({ role: "user", content: message });

    // Appeler l'API OpenAI
    const openai = getOpenAI();
    if (!openai) {
      // Fallback si pas de clé API - utiliser les données pour une réponse basique
      let fallbackMessage = "Bonjour ! Je suis CausePilot, votre assistant fundraising. ";
      if (fullContext) {
        fallbackMessage += `Votre organisation compte ${fullContext.summary.totalDonors} donateurs et a collecté ${fullContext.summary.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} au total. `;
        if (fullContext.summary.lapsedDonors > 0) {
          fallbackMessage += `Je remarque que ${fullContext.summary.lapsedDonors} donateurs sont inactifs depuis plus de 6 mois - une campagne de réactivation pourrait être bénéfique. `;
        }
      }
      fallbackMessage += "Pour activer toutes mes capacités IA, configurez la clé OPENAI_API_KEY dans les variables d'environnement.";
      
      return NextResponse.json({
        success: true,
        message: fallbackMessage,
        suggestions: generateSuggestions(context?.page, message, fullContext),
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";

    // Générer des suggestions de questions suivantes
    const suggestions = generateSuggestions(context?.page, message, fullContext);

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      suggestions,
    });
  } catch (error) {
    console.error("CausePilot chat error:", error);
    
    // Réponse de fallback si l'API échoue
    return NextResponse.json({
      success: true,
      message: "Je suis CausePilot, votre assistant fundraising ! Je suis là pour vous aider à maximiser vos collectes de fonds. Malheureusement, je rencontre un petit problème technique en ce moment. Réessayez dans quelques instants ou consultez notre documentation pour des conseils immédiats.",
      suggestions: [
        "Comment optimiser mes campagnes email ?",
        "Quelles sont les meilleures pratiques de fundraising ?",
        "Comment fidéliser mes donateurs ?",
      ],
    });
  }
}

interface FullContext {
  summary: {
    totalDonors: number;
    lapsedDonors: number;
    activeCampaignsCount: number;
  };
  emails: {
    openRate: string;
  };
  donors: {
    top10: Array<{ name: string }>;
  };
}

function generateSuggestions(page?: string, lastMessage?: string, context?: FullContext | null): string[] {
  // Suggestions personnalisées basées sur les données
  const dataDrivenSuggestions: string[] = [];
  
  if (context) {
    if (context.summary.lapsedDonors > 10) {
      dataDrivenSuggestions.push(`Comment réactiver mes ${context.summary.lapsedDonors} donateurs inactifs ?`);
    }
    if (context.summary.activeCampaignsCount === 0) {
      dataDrivenSuggestions.push("Aide-moi à créer une nouvelle campagne");
    }
    if (context.emails.openRate !== "N/A" && parseFloat(context.emails.openRate) < 20) {
      dataDrivenSuggestions.push("Comment améliorer mon taux d'ouverture email ?");
    }
    if (context.donors.top10.length > 0) {
      dataDrivenSuggestions.push("Comment fidéliser mes meilleurs donateurs ?");
    }
  }

  const pageSuggestions: Record<string, string[]> = {
    dashboard: [
      "Analyse mes performances de ce mois",
      "Quelles actions prioritaires recommandes-tu ?",
      "Compare mes résultats aux benchmarks du secteur",
    ],
    campaigns: [
      "Aide-moi à créer une campagne efficace",
      "Comment optimiser ma campagne actuelle ?",
      "Quel objectif de collecte recommandes-tu ?",
    ],
    donors: [
      "Qui sont mes donateurs à risque de churn ?",
      "Comment segmenter ma base efficacement ?",
      "Identifie mes meilleurs prospects de major gifts",
    ],
    marketing: [
      "Rédige un email de collecte percutant",
      "Quelle est la meilleure fréquence d'envoi ?",
      "Analyse mes dernières campagnes email",
    ],
    p2p: [
      "Comment recruter plus de collecteurs P2P ?",
      "Aide-moi à motiver mes ambassadeurs",
      "Quels outils donner à mes collecteurs ?",
    ],
  };

  const contextualSuggestions = pageSuggestions[page || ""] || [];
  
  // Combiner les suggestions basées sur les données et le contexte de page
  return [...dataDrivenSuggestions, ...contextualSuggestions].slice(0, 3);
}

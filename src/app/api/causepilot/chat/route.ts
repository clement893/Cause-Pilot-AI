import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Contexte système pour CausePilot
const CAUSEPILOT_SYSTEM_PROMPT = `Tu es CausePilot, l'assistant IA expert en collecte de fonds (fundraising) de la plateforme Cause Pilot AI.

Ta mission : Aider les fundraisers à lever le maximum de fonds possible pour leurs causes.

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
- Utilise des exemples concrets et actionnables
- Propose toujours des actions concrètes à mettre en place
- Célèbre les succès et motive lors des difficultés

Contexte de la plateforme Cause Pilot AI :
- Gestion de base de donateurs
- Campagnes email avec segmentation
- Collectes P2P (peer-to-peer fundraising)
- Formulaires de dons personnalisables
- Rapports et analytics
- Reçus fiscaux automatiques

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
        donorCount?: number;
        totalRaised?: number;
        activeCampaigns?: number;
      };
    };

    if (!message) {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Récupérer des statistiques pour enrichir le contexte
    let stats = null;
    try {
      const [donorCount, donationStats, campaignCount] = await Promise.all([
        prisma.donor.count(),
        prisma.donation.aggregate({
          _sum: { amount: true },
          _count: true,
        }),
        prisma.campaign.count({ where: { status: "ACTIVE" } }),
      ]);

      stats = {
        totalDonors: donorCount,
        totalRaised: donationStats._sum.amount || 0,
        totalDonations: donationStats._count,
        activeCampaigns: campaignCount,
      };
    } catch {
      // Si erreur de DB, continuer sans stats
    }

    // Construire le contexte enrichi
    let contextMessage = "";
    if (stats) {
      contextMessage = `\n\nContexte actuel de l'organisation :
- ${stats.totalDonors} donateurs dans la base
- ${stats.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} collectés au total
- ${stats.totalDonations} dons reçus
- ${stats.activeCampaigns} campagnes actives`;
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";

    // Générer des suggestions de questions suivantes
    const suggestions = generateSuggestions(context?.page, message);

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

function generateSuggestions(page?: string, lastMessage?: string): string[] {
  const defaultSuggestions = [
    "Comment augmenter mon taux de conversion ?",
    "Quelles sont les meilleures pratiques pour les emails de collecte ?",
    "Comment segmenter efficacement ma base de donateurs ?",
  ];

  const pageSuggestions: Record<string, string[]> = {
    dashboard: [
      "Comment interpréter mes métriques de collecte ?",
      "Quelles actions prioritaires pour cette semaine ?",
      "Comment améliorer mon taux de rétention ?",
    ],
    campaigns: [
      "Comment créer une campagne qui convertit ?",
      "Quel est le meilleur moment pour lancer une campagne ?",
      "Comment rédiger un message d'appel aux dons efficace ?",
    ],
    donors: [
      "Comment identifier mes meilleurs donateurs potentiels ?",
      "Stratégies pour réactiver les donateurs inactifs ?",
      "Comment personnaliser mes communications ?",
    ],
    marketing: [
      "Comment améliorer mon taux d'ouverture email ?",
      "Quelle fréquence d'envoi recommandes-tu ?",
      "Comment créer un objet d'email accrocheur ?",
    ],
    p2p: [
      "Comment motiver mes collecteurs P2P ?",
      "Quels outils donner à mes ambassadeurs ?",
      "Comment maximiser le partage sur les réseaux sociaux ?",
    ],
  };

  return pageSuggestions[page || ""] || defaultSuggestions;
}

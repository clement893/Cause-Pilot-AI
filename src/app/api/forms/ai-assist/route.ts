import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

// Initialiser OpenAI
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

// Types d'assistance disponibles
type AssistType = 
  | "create_suggestions"      // Suggestions pour créer un nouveau formulaire
  | "optimize_amounts"        // Optimiser les montants suggérés
  | "improve_text"           // Améliorer les textes (titre, description, remerciement)
  | "analyze_performance"    // Analyser les performances d'un formulaire
  | "conversion_tips"        // Conseils pour améliorer le taux de conversion
  | "field_suggestions";     // Suggestions de champs à activer

interface AssistRequest {
  type: AssistType;
  formId?: string;
  formType?: string;
  currentData?: {
    name?: string;
    description?: string;
    suggestedAmounts?: number[];
    thankYouMessage?: string;
    formType?: string;
  };
  campaignContext?: {
    name?: string;
    goal?: number;
    type?: string;
  };
}

// Récupérer les statistiques des formulaires pour le contexte
async function getFormStats() {
  try {
    const [totalForms, totalSubmissions, formPerformance] = await Promise.all([
      prisma.donationForm.count(),
      prisma.donationSubmission.count(),
      prisma.donationForm.findMany({
        select: {
          id: true,
          name: true,
          formType: true,
          suggestedAmounts: true,
          _count: {
            select: { DonationSubmission: true }
          }
        },
        orderBy: {
          DonationSubmission: { _count: "desc" }
        },
        take: 5
      })
    ]);

    // Calculer les montants moyens des dons
    const avgDonation = await prisma.donationSubmission.aggregate({
      _avg: { amount: true }
    });

    // Analyser les montants les plus choisis
    const popularAmounts = await prisma.donationSubmission.groupBy({
      by: ["amount"],
      _count: true,
      orderBy: { _count: { amount: "desc" } },
      take: 10
    });

    return {
      totalForms,
      totalSubmissions,
      avgDonation: avgDonation._avg?.amount || 0,
      topForms: formPerformance.map(f => ({
        name: f.name,
        type: f.formType,
        submissions: f._count.DonationSubmission,
        amounts: f.suggestedAmounts
      })),
      popularAmounts: popularAmounts.map(p => ({
        amount: p.amount,
        count: p._count
      }))
    };
  } catch {
    return null;
  }
}

// Récupérer les données d'un formulaire spécifique
async function getFormData(formId: string) {
  try {
    const form = await prisma.donationForm.findUnique({
      where: { id: formId },
      include: {
        _count: {
          select: { DonationSubmission: true }
        }
      }
    });

    if (!form) return null;

    // Statistiques des soumissions
    const submissions = await prisma.donationSubmission.findMany({
      where: { formId },
      select: {
        amount: true,
        createdAt: true,
        paymentStatus: true
      }
    });

    const completedSubmissions = submissions.filter(s => s.paymentStatus === "COMPLETED");
    const totalRaised = completedSubmissions.reduce((sum, s) => sum + s.amount, 0);
    const avgAmount = completedSubmissions.length > 0 
      ? totalRaised / completedSubmissions.length 
      : 0;

    // Répartition par montant
    const amountDistribution: Record<number, number> = {};
    completedSubmissions.forEach(s => {
      amountDistribution[s.amount] = (amountDistribution[s.amount] || 0) + 1;
    });

    return {
      form,
      stats: {
        totalSubmissions: form._count.DonationSubmission,
        completedSubmissions: completedSubmissions.length,
        totalRaised,
        avgAmount,
        conversionRate: form._count.DonationSubmission > 0 
          ? (completedSubmissions.length / form._count.DonationSubmission * 100).toFixed(1)
          : 0,
        amountDistribution
      }
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AssistRequest;
    const { type, formId, currentData, campaignContext } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Type d'assistance requis" },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json({
        success: false,
        error: "API OpenAI non configurée",
        fallbackSuggestions: getFallbackSuggestions(type)
      });
    }

    // Collecter le contexte
    const formStats = await getFormStats();
    let formData = null;
    if (formId) {
      formData = await getFormData(formId);
    }

    // Construire le prompt selon le type d'assistance
    const systemPrompt = buildSystemPrompt(type, formStats, formData, currentData, campaignContext);
    const userPrompt = buildUserPrompt(type, currentData, campaignContext);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return NextResponse.json({
        success: false,
        error: "Pas de réponse de l'IA"
      });
    }

    const suggestions = JSON.parse(response);

    return NextResponse.json({
      success: true,
      type,
      suggestions
    });

  } catch (error) {
    console.error("Form AI assist error:", error);
    return NextResponse.json({
      success: false,
      error: "Erreur lors de la génération des suggestions"
    }, { status: 500 });
  }
}

function buildSystemPrompt(
  type: AssistType,
  formStats: Awaited<ReturnType<typeof getFormStats>>,
  formData: Awaited<ReturnType<typeof getFormData>>,
  currentData?: AssistRequest["currentData"],
  campaignContext?: AssistRequest["campaignContext"]
): string {
  let basePrompt = `Tu es CausePilot, expert en optimisation de formulaires de don et en fundraising.
Tu dois fournir des suggestions concrètes et actionnables pour améliorer les formulaires de collecte de fonds.

Réponds TOUJOURS en JSON valide avec la structure appropriée selon le type de demande.
Utilise le français pour tous les textes suggérés.`;

  if (formStats) {
    basePrompt += `

CONTEXTE DE L'ORGANISATION :
- ${formStats.totalForms} formulaires créés
- ${formStats.totalSubmissions} soumissions totales
- Don moyen : ${formStats.avgDonation.toFixed(2)} CAD
- Montants populaires : ${formStats.popularAmounts.slice(0, 5).map(p => `${p.amount}$ (${p.count}x)`).join(", ")}`;
  }

  if (formData) {
    basePrompt += `

DONNÉES DU FORMULAIRE ACTUEL :
- Nom : ${formData.form.name}
- Type : ${formData.form.formType}
- Montants suggérés : ${formData.form.suggestedAmounts.join(", ")} CAD
- Soumissions : ${formData.stats.totalSubmissions}
- Complétées : ${formData.stats.completedSubmissions}
- Total collecté : ${formData.stats.totalRaised.toFixed(2)} CAD
- Don moyen : ${formData.stats.avgAmount.toFixed(2)} CAD
- Taux de conversion : ${formData.stats.conversionRate}%`;
  }

  if (campaignContext) {
    basePrompt += `

CONTEXTE DE LA CAMPAGNE :
- Nom : ${campaignContext.name || "Non défini"}
- Objectif : ${campaignContext.goal ? campaignContext.goal + " CAD" : "Non défini"}
- Type : ${campaignContext.type || "Non défini"}`;
  }

  // Instructions spécifiques selon le type
  switch (type) {
    case "create_suggestions":
      basePrompt += `

TÂCHE : Suggérer une configuration complète pour un nouveau formulaire de don.
FORMAT DE RÉPONSE JSON :
{
  "name": "Nom suggéré pour le formulaire",
  "description": "Description engageante (2-3 phrases)",
  "suggestedAmounts": [montant1, montant2, montant3, montant4, montant5],
  "thankYouMessage": "Message de remerciement personnalisé",
  "recommendedFields": ["phone", "address", "employer", "comment", "dedication"],
  "tips": ["Conseil 1", "Conseil 2", "Conseil 3"]
}`;
      break;

    case "optimize_amounts":
      basePrompt += `

TÂCHE : Optimiser les montants suggérés pour maximiser les dons.
Basé sur les données, suggère 5 montants stratégiques.
FORMAT DE RÉPONSE JSON :
{
  "suggestedAmounts": [montant1, montant2, montant3, montant4, montant5],
  "reasoning": "Explication de la stratégie",
  "expectedImpact": "Impact attendu sur les dons",
  "tips": ["Conseil 1", "Conseil 2"]
}`;
      break;

    case "improve_text":
      basePrompt += `

TÂCHE : Améliorer les textes du formulaire pour augmenter l'engagement.
FORMAT DE RÉPONSE JSON :
{
  "improvedName": "Nom amélioré (si applicable)",
  "improvedDescription": "Description améliorée et engageante",
  "improvedThankYou": "Message de remerciement amélioré",
  "callToAction": "Texte du bouton de don suggéré",
  "tips": ["Conseil 1", "Conseil 2"]
}`;
      break;

    case "analyze_performance":
      basePrompt += `

TÂCHE : Analyser les performances du formulaire et identifier les opportunités d'amélioration.
FORMAT DE RÉPONSE JSON :
{
  "overallScore": 85,
  "strengths": ["Point fort 1", "Point fort 2"],
  "weaknesses": ["Point faible 1", "Point faible 2"],
  "recommendations": [
    {"priority": "high", "action": "Action recommandée", "expectedImpact": "Impact attendu"},
    {"priority": "medium", "action": "Action recommandée", "expectedImpact": "Impact attendu"}
  ],
  "benchmarkComparison": "Comparaison avec les benchmarks du secteur"
}`;
      break;

    case "conversion_tips":
      basePrompt += `

TÂCHE : Fournir des conseils spécifiques pour améliorer le taux de conversion.
FORMAT DE RÉPONSE JSON :
{
  "currentConversionAnalysis": "Analyse du taux actuel",
  "quickWins": ["Action rapide 1", "Action rapide 2", "Action rapide 3"],
  "strategicChanges": ["Changement stratégique 1", "Changement stratégique 2"],
  "testingIdeas": ["Idée de test A/B 1", "Idée de test A/B 2"],
  "expectedImprovement": "Amélioration potentielle du taux de conversion"
}`;
      break;

    case "field_suggestions":
      basePrompt += `

TÂCHE : Suggérer quels champs activer/désactiver selon le type de formulaire et la campagne.
FORMAT DE RÉPONSE JSON :
{
  "recommendedFields": {
    "phone": {"enabled": true, "required": false, "reason": "Raison"},
    "address": {"enabled": true, "required": false, "reason": "Raison"},
    "employer": {"enabled": false, "required": false, "reason": "Raison"},
    "comment": {"enabled": true, "required": false, "reason": "Raison"},
    "dedication": {"enabled": false, "required": false, "reason": "Raison"},
    "anonymous": {"enabled": true, "reason": "Raison"}
  },
  "overallStrategy": "Explication de la stratégie de champs"
}`;
      break;
  }

  return basePrompt;
}

function buildUserPrompt(
  type: AssistType,
  currentData?: AssistRequest["currentData"],
  campaignContext?: AssistRequest["campaignContext"]
): string {
  switch (type) {
    case "create_suggestions":
      if (campaignContext) {
        return `Crée un formulaire de don optimisé pour la campagne "${campaignContext.name}" avec un objectif de ${campaignContext.goal} CAD.`;
      }
      return `Crée un formulaire de don générique optimisé pour maximiser les conversions.`;

    case "optimize_amounts":
      if (currentData?.suggestedAmounts) {
        return `Les montants actuels sont : ${currentData.suggestedAmounts.join(", ")} CAD. Optimise-les pour augmenter le don moyen.`;
      }
      return `Suggère 5 montants optimaux pour un formulaire de don.`;

    case "improve_text":
      let textPrompt = "Améliore les textes suivants :\n";
      if (currentData?.name) textPrompt += `- Nom actuel : "${currentData.name}"\n`;
      if (currentData?.description) textPrompt += `- Description actuelle : "${currentData.description}"\n`;
      if (currentData?.thankYouMessage) textPrompt += `- Message de remerciement actuel : "${currentData.thankYouMessage}"\n`;
      return textPrompt || "Suggère des textes engageants pour un formulaire de don.";

    case "analyze_performance":
      return "Analyse les performances de ce formulaire et fournis des recommandations d'amélioration.";

    case "conversion_tips":
      return "Fournis des conseils pour améliorer le taux de conversion de ce formulaire.";

    case "field_suggestions":
      const formType = currentData?.formType || "ONE_TIME";
      return `Suggère les champs à activer pour un formulaire de type "${formType}"${campaignContext ? ` lié à la campagne "${campaignContext.name}"` : ""}.`;

    default:
      return "Fournis des suggestions pour améliorer ce formulaire de don.";
  }
}

function getFallbackSuggestions(type: AssistType) {
  switch (type) {
    case "create_suggestions":
      return {
        name: "Formulaire de don",
        description: "Soutenez notre cause et faites la différence aujourd'hui.",
        suggestedAmounts: [25, 50, 100, 250, 500],
        thankYouMessage: "Merci infiniment pour votre générosité ! Votre don fait une réelle différence.",
        recommendedFields: ["comment"],
        tips: [
          "Utilisez des montants qui se terminent par 5 ou 0",
          "Incluez un montant accessible et un montant ambitieux",
          "Personnalisez le message de remerciement"
        ]
      };

    case "optimize_amounts":
      return {
        suggestedAmounts: [25, 50, 100, 250, 500],
        reasoning: "Ces montants couvrent différents niveaux de générosité",
        tips: ["Le montant du milieu est souvent le plus choisi"]
      };

    default:
      return {
        tips: [
          "Gardez le formulaire simple et rapide à remplir",
          "Utilisez des visuels engageants",
          "Montrez l'impact des dons"
        ]
      };
  }
}

import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.BUILT_IN_FORGE_API_KEY;
const OPENAI_API_URL = process.env.OPENAI_API_URL || process.env.BUILT_IN_FORGE_API_URL || "https://api.openai.com/v1";

interface AIAssistRequest {
  action: "generate" | "improve" | "translate" | "shorten" | "expand";
  context?: string;
  subject?: string;
  content?: string;
  tone?: "professional" | "friendly" | "urgent" | "inspirational";
  campaignType?: string;
  targetAudience?: string;
  language?: string;
}

// POST - Assistance IA pour la rédaction d'emails
export async function POST(request: NextRequest) {
  try {
    const body: AIAssistRequest = await request.json();
    const { action, context, subject, content, tone = "professional", campaignType, targetAudience, language = "fr" } = body;

    const systemPrompt = `Tu es un expert en marketing email pour les organisations à but non lucratif et les fondations. 
Tu rédiges des emails professionnels, engageants et efficaces pour les campagnes de collecte de fonds.
Tu dois toujours répondre en ${language === "fr" ? "français" : "anglais"}.
Le ton doit être ${getToneDescription(tone)}.`;

    let userPrompt = "";

    switch (action) {
      case "generate":
        userPrompt = `Génère un email complet pour une campagne de type "${campaignType || "collecte de fonds"}".
${context ? `Contexte: ${context}` : ""}
${targetAudience ? `Public cible: ${targetAudience}` : ""}
${subject ? `Sujet suggéré: ${subject}` : ""}

Retourne un JSON avec les champs suivants:
{
  "subject": "Objet de l'email",
  "preheader": "Texte de prévisualisation (max 100 caractères)",
  "htmlContent": "Contenu HTML de l'email avec mise en forme",
  "textContent": "Version texte brut de l'email"
}

L'email doit inclure:
- Un titre accrocheur
- Une introduction personnalisée avec {{firstName}}
- Le message principal avec appel à l'action
- Une signature professionnelle

Utilise des balises HTML simples (h1, h2, p, a, strong, em) pour le formatage.`;
        break;

      case "improve":
        userPrompt = `Améliore cet email pour le rendre plus engageant et efficace:

Sujet actuel: ${subject || "Non défini"}
Contenu actuel:
${content}

Retourne un JSON avec les champs suivants:
{
  "subject": "Nouvel objet amélioré",
  "preheader": "Nouveau texte de prévisualisation",
  "htmlContent": "Contenu HTML amélioré",
  "textContent": "Version texte brut améliorée",
  "suggestions": ["Liste des améliorations apportées"]
}`;
        break;

      case "translate":
        const targetLang = language === "fr" ? "anglais" : "français";
        userPrompt = `Traduis cet email en ${targetLang}:

Sujet: ${subject}
Contenu:
${content}

Retourne un JSON avec les champs suivants:
{
  "subject": "Sujet traduit",
  "preheader": "Préheader traduit",
  "htmlContent": "Contenu HTML traduit",
  "textContent": "Version texte traduite"
}`;
        break;

      case "shorten":
        userPrompt = `Raccourcis cet email tout en gardant les points essentiels:

Sujet: ${subject}
Contenu:
${content}

Retourne un JSON avec les champs suivants:
{
  "subject": "Sujet concis",
  "preheader": "Préheader court",
  "htmlContent": "Contenu HTML raccourci",
  "textContent": "Version texte raccourcie"
}`;
        break;

      case "expand":
        userPrompt = `Développe cet email avec plus de détails et d'émotion:

Sujet: ${subject}
Contenu:
${content}

Retourne un JSON avec les champs suivants:
{
  "subject": "Sujet enrichi",
  "preheader": "Préheader développé",
  "htmlContent": "Contenu HTML développé",
  "textContent": "Version texte développée"
}`;
        break;

      default:
        return NextResponse.json(
          { error: "Action non reconnue" },
          { status: 400 }
        );
    }

    // Appel à l'API OpenAI/LLM
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("LLM API error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la génération du contenu" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedContent = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      success: true,
      ...generatedContent,
    });
  } catch (error) {
    console.error("Error in AI assist:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'assistance IA" },
      { status: 500 }
    );
  }
}

function getToneDescription(tone: string): string {
  switch (tone) {
    case "professional":
      return "professionnel et respectueux";
    case "friendly":
      return "chaleureux et amical";
    case "urgent":
      return "urgent et pressant, créant un sentiment d'importance";
    case "inspirational":
      return "inspirant et motivant, touchant les émotions";
    default:
      return "professionnel";
  }
}

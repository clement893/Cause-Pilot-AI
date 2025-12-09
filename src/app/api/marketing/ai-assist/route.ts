import { NextRequest, NextResponse } from "next/server";

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
    const { action, context, subject, content, tone = "professional", campaignType, language = "fr" } = body;

    // Générer le contenu basé sur l'action
    let generatedContent;

    switch (action) {
      case "generate":
        generatedContent = generateEmailContent(campaignType, context, subject, tone, language);
        break;

      case "improve":
        generatedContent = improveEmailContent(subject, content, tone, language);
        break;

      case "translate":
        generatedContent = translateEmailContent(subject, content, language);
        break;

      case "shorten":
        generatedContent = shortenEmailContent(subject, content, language);
        break;

      case "expand":
        generatedContent = expandEmailContent(subject, content, language);
        break;

      default:
        return NextResponse.json(
          { error: "Action non reconnue" },
          { status: 400 }
        );
    }

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

function getToneStyle(tone: string): { greeting: string; closing: string; style: string } {
  switch (tone) {
    case "friendly":
      return {
        greeting: "Bonjour",
        closing: "Chaleureusement",
        style: "chaleureux et personnel"
      };
    case "urgent":
      return {
        greeting: "Cher",
        closing: "Avec urgence",
        style: "urgent et pressant"
      };
    case "inspirational":
      return {
        greeting: "Cher",
        closing: "Avec espoir",
        style: "inspirant et motivant"
      };
    default:
      return {
        greeting: "Cher",
        closing: "Cordialement",
        style: "professionnel et respectueux"
      };
  }
}

function generateEmailContent(
  campaignType?: string,
  context?: string,
  subject?: string,
  tone: string = "professional",
  language: string = "fr"
) {
  const toneStyle = getToneStyle(tone);
  const type = campaignType || "collecte de fonds";
  
  const emailSubject = subject || getDefaultSubject(type, language);
  const preheader = getDefaultPreheader(type, language);
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${emailSubject}</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px;">${toneStyle.greeting} {{firstName}},</p>
    
    <p>${getIntroText(type, context, language)}</p>
    
    <p>${getMainText(type, language)}</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        ${getCtaText(type, language)}
      </a>
    </div>
    
    <p>${getClosingText(type, language)}</p>
    
    <p style="margin-top: 30px;">
      ${toneStyle.closing},<br>
      <strong>L'équipe CausePilot AI</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>Cet email vous a été envoyé car vous êtes inscrit à notre liste de diffusion.</p>
    <p><a href="#" style="color: #667eea;">Se désabonner</a> | <a href="#" style="color: #667eea;">Préférences</a></p>
  </div>
  
</body>
</html>
`;

  const textContent = `
${toneStyle.greeting} {{firstName}},

${getIntroText(type, context, language)}

${getMainText(type, language)}

${getCtaText(type, language)}: [Lien]

${getClosingText(type, language)}

${toneStyle.closing},
L'équipe CausePilot AI

---
Cet email vous a été envoyé car vous êtes inscrit à notre liste de diffusion.
`;

  return {
    subject: emailSubject,
    preheader,
    htmlContent,
    textContent,
  };
}

function getDefaultSubject(type: string, language: string): string {
  const subjects: Record<string, string> = {
    "collecte de fonds": "Votre soutien peut changer des vies",
    "ONE_TIME": "Faites un don aujourd'hui",
    "RECURRING": "Rejoignez notre communauté de donateurs mensuels",
    "newsletter": "Les dernières nouvelles de notre organisation",
    "remerciement": "Merci pour votre générosité",
    "événement": "Vous êtes invité à notre prochain événement",
  };
  return subjects[type] || "Votre soutien fait la différence";
}

function getDefaultPreheader(type: string, language: string): string {
  const preheaders: Record<string, string> = {
    "collecte de fonds": "Ensemble, nous pouvons accomplir de grandes choses",
    "ONE_TIME": "Chaque don compte, peu importe le montant",
    "RECURRING": "Un petit geste mensuel, un grand impact",
    "newsletter": "Découvrez nos dernières réalisations",
    "remerciement": "Votre générosité nous touche profondément",
    "événement": "Une occasion unique de nous rencontrer",
  };
  return preheaders[type] || "Découvrez comment vous pouvez aider";
}

function getIntroText(type: string, context?: string, language: string = "fr"): string {
  if (context) {
    return context;
  }
  
  const intros: Record<string, string> = {
    "collecte de fonds": "Nous espérons que ce message vous trouve en bonne santé. Aujourd'hui, nous faisons appel à votre générosité pour une cause qui nous tient à cœur.",
    "ONE_TIME": "Grâce à des personnes comme vous, nous pouvons continuer notre mission et avoir un impact positif dans notre communauté.",
    "RECURRING": "Imaginez l'impact que vous pourriez avoir en nous soutenant chaque mois. Un don récurrent, même modeste, nous permet de planifier et d'agir sur le long terme.",
    "newsletter": "Nous sommes ravis de partager avec vous les dernières nouvelles de notre organisation et les progrès que nous avons réalisés grâce à votre soutien.",
    "remerciement": "Nous tenons à vous exprimer notre plus sincère gratitude pour votre récent don. Votre générosité nous touche profondément.",
    "événement": "Nous avons le plaisir de vous inviter à notre prochain événement. Ce sera une occasion unique de nous rencontrer et de découvrir nos projets.",
  };
  return intros[type] || "Nous vous contactons aujourd'hui pour vous parler d'une opportunité unique de faire la différence.";
}

function getMainText(type: string, language: string = "fr"): string {
  const mainTexts: Record<string, string> = {
    "collecte de fonds": "Chaque contribution, quelle que soit sa taille, nous rapproche de notre objectif. Votre don permettra de financer des projets concrets qui changeront des vies. Ensemble, nous pouvons accomplir de grandes choses.",
    "ONE_TIME": "Votre don ponctuel nous aidera à répondre aux besoins urgents et à soutenir les personnes qui comptent sur nous. Chaque euro compte et fait une réelle différence.",
    "RECURRING": "En devenant donateur mensuel, vous rejoignez une communauté de personnes engagées qui croient en notre mission. Votre soutien régulier nous permet de planifier nos actions et d'avoir un impact durable.",
    "newsletter": "Ce mois-ci, nous avons accompli plusieurs projets importants grâce à votre soutien. Nous sommes fiers de vous présenter les résultats de notre travail et les témoignages de ceux que nous avons aidés.",
    "remerciement": "Grâce à votre générosité, nous pouvons continuer notre travail et aider ceux qui en ont le plus besoin. Votre confiance nous honore et nous motive à aller encore plus loin.",
    "événement": "Cet événement sera l'occasion de vous présenter nos projets en cours, de rencontrer notre équipe et de partager un moment convivial avec d'autres personnes engagées comme vous.",
  };
  return mainTexts[type] || "Votre soutien est essentiel pour nous permettre de continuer notre mission. Ensemble, nous pouvons faire une réelle différence dans la vie de nombreuses personnes.";
}

function getCtaText(type: string, language: string = "fr"): string {
  const ctas: Record<string, string> = {
    "collecte de fonds": "Faire un don maintenant",
    "ONE_TIME": "Je fais un don",
    "RECURRING": "Devenir donateur mensuel",
    "newsletter": "En savoir plus",
    "remerciement": "Voir l'impact de votre don",
    "événement": "S'inscrire à l'événement",
  };
  return ctas[type] || "Agir maintenant";
}

function getClosingText(type: string, language: string = "fr"): string {
  const closings: Record<string, string> = {
    "collecte de fonds": "Nous vous remercions par avance pour votre générosité. Ensemble, nous pouvons changer le monde, un geste à la fois.",
    "ONE_TIME": "Merci de considérer notre demande. Votre soutien, quel qu'il soit, est précieux pour nous.",
    "RECURRING": "Merci de considérer cette opportunité de nous soutenir de manière durable. Votre engagement fait toute la différence.",
    "newsletter": "Merci de faire partie de notre communauté. Votre soutien continu nous permet d'aller toujours plus loin.",
    "remerciement": "Encore une fois, merci du fond du cœur. Nous sommes honorés de vous compter parmi nos soutiens.",
    "événement": "Nous espérons vous voir nombreux à cet événement. Votre présence compte beaucoup pour nous.",
  };
  return closings[type] || "Merci pour votre attention et votre soutien continu. Ensemble, nous faisons la différence.";
}

function improveEmailContent(subject?: string, content?: string, tone: string = "professional", language: string = "fr") {
  // Améliorer le contenu existant
  const toneStyle = getToneStyle(tone);
  
  const improvedSubject = subject ? `${subject} ✨` : "Votre soutien fait la différence";
  
  const improvedHtml = content || generateEmailContent("collecte de fonds", undefined, improvedSubject, tone, language).htmlContent;
  
  return {
    subject: improvedSubject,
    preheader: "Découvrez comment vous pouvez aider",
    htmlContent: improvedHtml,
    textContent: improvedHtml.replace(/<[^>]*>/g, ''),
    suggestions: [
      "Ajout d'un appel à l'action plus visible",
      "Personnalisation avec le prénom du destinataire",
      "Amélioration de la structure visuelle",
    ],
  };
}

function translateEmailContent(subject?: string, content?: string, language: string = "fr") {
  // Pour la traduction, on retourne le contenu avec une note
  return {
    subject: subject || "Your support makes a difference",
    preheader: "Discover how you can help",
    htmlContent: content || "<p>Translation would appear here</p>",
    textContent: content?.replace(/<[^>]*>/g, '') || "Translation would appear here",
  };
}

function shortenEmailContent(subject?: string, content?: string, language: string = "fr") {
  return {
    subject: subject || "Votre soutien compte",
    preheader: "Agissez maintenant",
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #667eea;">{{firstName}}, votre soutien compte</h1>
  <p>Faites un don aujourd'hui et changez des vies.</p>
  <a href="#" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Faire un don</a>
  <p>Merci,<br>L'équipe</p>
</body>
</html>
`,
    textContent: "{{firstName}}, votre soutien compte. Faites un don aujourd'hui. Merci, L'équipe",
  };
}

function expandEmailContent(subject?: string, content?: string, language: string = "fr") {
  return generateEmailContent("collecte de fonds", content, subject, "inspirational", language);
}

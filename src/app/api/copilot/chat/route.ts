import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Types pour les messages
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
}

// Fonctions d'analyse des données
async function getDonorStats() {
  const totalDonors = await prisma.donor.count();
  const activeDonors = await prisma.donor.count({ where: { status: "ACTIVE" } });
  const totalDonations = await prisma.donor.aggregate({
    _sum: { totalDonations: true },
    _avg: { averageDonation: true },
  });
  
  return {
    totalDonors,
    activeDonors,
    totalCollected: totalDonations._sum.totalDonations || 0,
    averageDonation: totalDonations._avg.averageDonation || 0,
  };
}

async function getTopDonors(limit = 5) {
  return prisma.donor.findMany({
    where: { status: "ACTIVE" },
    orderBy: { totalDonations: "desc" },
    take: limit,
    select: {
      firstName: true,
      lastName: true,
      email: true,
      totalDonations: true,
      donationCount: true,
      city: true,
      segment: true,
    },
  });
}

async function getRecentDonations(limit = 10) {
  return prisma.donationSubmission.findMany({
    where: { paymentStatus: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      amount: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      DonationForm: { select: { name: true } },
    },
  });
}

async function getDonorsBySegment() {
  return prisma.donor.groupBy({
    by: ["segment"],
    _count: true,
    _sum: { totalDonations: true },
  });
}

async function getFormStats() {
  const forms = await prisma.donationForm.findMany({
    where: { status: "PUBLISHED" },
    select: {
      name: true,
      formType: true,
      totalCollected: true,
      donationCount: true,
      goalAmount: true,
    },
  });
  return forms;
}

async function searchDonors(query: string) {
  return prisma.donor.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    select: {
      firstName: true,
      lastName: true,
      email: true,
      totalDonations: true,
      status: true,
      city: true,
    },
  });
}

// Analyser l'intention de l'utilisateur
function analyzeIntent(message: string): { intent: string; params: Record<string, string> } {
  const lowerMessage = message.toLowerCase();
  
  // Statistiques générales
  if (lowerMessage.includes("statistique") || lowerMessage.includes("résumé") || lowerMessage.includes("aperçu") || lowerMessage.includes("overview")) {
    return { intent: "stats", params: {} };
  }
  
  // Top donateurs
  if (lowerMessage.includes("top") && (lowerMessage.includes("donateur") || lowerMessage.includes("donor"))) {
    const match = lowerMessage.match(/top\s*(\d+)/);
    return { intent: "top_donors", params: { limit: match ? match[1] : "5" } };
  }
  
  // Dons récents
  if (lowerMessage.includes("récent") || lowerMessage.includes("dernier") || lowerMessage.includes("recent")) {
    return { intent: "recent_donations", params: {} };
  }
  
  // Segments
  if (lowerMessage.includes("segment") || lowerMessage.includes("répartition") || lowerMessage.includes("distribution")) {
    return { intent: "segments", params: {} };
  }
  
  // Formulaires
  if (lowerMessage.includes("formulaire") || lowerMessage.includes("form") || lowerMessage.includes("campagne")) {
    return { intent: "forms", params: {} };
  }
  
  // Recherche de donateur
  if (lowerMessage.includes("cherche") || lowerMessage.includes("trouve") || lowerMessage.includes("search") || lowerMessage.includes("qui est")) {
    const searchTerms = lowerMessage.replace(/cherche|trouve|search|qui est|le donateur|la donatrice/gi, "").trim();
    return { intent: "search_donor", params: { query: searchTerms } };
  }
  
  // Recommandations
  if (lowerMessage.includes("recommand") || lowerMessage.includes("conseil") || lowerMessage.includes("suggère") || lowerMessage.includes("améliorer")) {
    return { intent: "recommendations", params: {} };
  }
  
  // Question générale
  return { intent: "general", params: {} };
}

// Générer une réponse basée sur l'intention
async function generateResponse(intent: string, params: Record<string, string>): Promise<string> {
  switch (intent) {
    case "stats": {
      const stats = await getDonorStats();
      return `## 📊 Aperçu de votre base de données

| Métrique | Valeur |
|----------|--------|
| **Donateurs totaux** | ${stats.totalDonors.toLocaleString("fr-CA")} |
| **Donateurs actifs** | ${stats.activeDonors.toLocaleString("fr-CA")} |
| **Total collecté** | ${stats.totalCollected.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} |
| **Don moyen** | ${stats.averageDonation.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} |

Voulez-vous plus de détails sur un aspect particulier ?`;
    }
    
    case "top_donors": {
      const limit = parseInt(params.limit || "5");
      const topDonors = await getTopDonors(limit);
      
      if (topDonors.length === 0) {
        return "Aucun donateur trouvé dans la base de données.";
      }
      
      let response = `## 🏆 Top ${limit} Donateurs\n\n`;
      response += "| # | Nom | Ville | Total des dons | Nb de dons |\n";
      response += "|---|-----|-------|----------------|------------|\n";
      
      topDonors.forEach((donor, i) => {
        response += `| ${i + 1} | ${donor.firstName} ${donor.lastName} | ${donor.city || "N/A"} | ${donor.totalDonations.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} | ${donor.donationCount} |\n`;
      });
      
      return response;
    }
    
    case "recent_donations": {
      const recentDonations = await getRecentDonations();
      
      if (recentDonations.length === 0) {
        return "Aucun don récent trouvé.";
      }
      
      let response = "## 💰 Dons Récents\n\n";
      response += "| Date | Donateur | Montant | Formulaire |\n";
      response += "|------|----------|---------|------------|\n";
      
      recentDonations.forEach((donation) => {
        const date = new Date(donation.createdAt).toLocaleDateString("fr-CA");
        response += `| ${date} | ${donation.firstName} ${donation.lastName} | ${donation.amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} | ${donation.DonationForm?.name || "N/A"} |\n`;
      });
      
      return response;
    }
    
    case "segments": {
      const segments = await getDonorsBySegment();
      
      if (segments.length === 0) {
        return "Aucun segment défini pour le moment.";
      }
      
      let response = "## 📈 Répartition par Segment\n\n";
      response += "| Segment | Donateurs | Total des dons |\n";
      response += "|---------|-----------|----------------|\n";
      
      segments.forEach((seg) => {
        response += `| ${seg.segment || "Non défini"} | ${seg._count} | ${(seg._sum.totalDonations || 0).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} |\n`;
      });
      
      return response;
    }
    
    case "forms": {
      const forms = await getFormStats();
      
      if (forms.length === 0) {
        return "Aucun formulaire de don publié.";
      }
      
      let response = "## 📝 Formulaires de Don\n\n";
      response += "| Nom | Type | Collecté | Objectif | Progression |\n";
      response += "|-----|------|----------|----------|-------------|\n";
      
      forms.forEach((form) => {
        const progress = form.goalAmount ? Math.round((form.totalCollected / form.goalAmount) * 100) : "N/A";
        response += `| ${form.name} | ${form.formType} | ${form.totalCollected.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} | ${form.goalAmount?.toLocaleString("fr-CA", { style: "currency", currency: "CAD" }) || "N/A"} | ${progress}% |\n`;
      });
      
      return response;
    }
    
    case "search_donor": {
      const query = params.query;
      if (!query || query.length < 2) {
        return "Veuillez préciser le nom ou l'email du donateur que vous recherchez.";
      }
      
      const donors = await searchDonors(query);
      
      if (donors.length === 0) {
        return `Aucun donateur trouvé pour "${query}".`;
      }
      
      let response = `## 🔍 Résultats pour "${query}"\n\n`;
      response += "| Nom | Email | Ville | Total dons | Statut |\n";
      response += "|-----|-------|-------|------------|--------|\n";
      
      donors.forEach((donor) => {
        response += `| ${donor.firstName} ${donor.lastName} | ${donor.email || "N/A"} | ${donor.city || "N/A"} | ${donor.totalDonations.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} | ${donor.status} |\n`;
      });
      
      return response;
    }
    
    case "recommendations": {
      const stats = await getDonorStats();
      const segments = await getDonorsBySegment();
      
      let response = "## 💡 Recommandations\n\n";
      
      // Analyser et générer des recommandations
      const inactiveRate = ((stats.totalDonors - stats.activeDonors) / stats.totalDonors) * 100;
      
      response += "### Actions suggérées\n\n";
      
      if (inactiveRate > 30) {
        response += `1. **Réactivation des donateurs** - ${inactiveRate.toFixed(1)}% de vos donateurs sont inactifs. Lancez une campagne de réengagement.\n\n`;
      }
      
      if (stats.averageDonation < 100) {
        response += `2. **Augmenter le don moyen** - Votre don moyen est de ${stats.averageDonation.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}. Proposez des montants suggérés plus élevés.\n\n`;
      }
      
      const undefinedSegments = segments.filter(s => !s.segment);
      if (undefinedSegments.length > 0) {
        response += `3. **Segmentation** - ${undefinedSegments[0]?._count || 0} donateurs n'ont pas de segment défini. Améliorez votre segmentation pour des communications ciblées.\n\n`;
      }
      
      response += "4. **Dons récurrents** - Encouragez les donateurs uniques à passer aux dons mensuels pour stabiliser vos revenus.\n\n";
      
      response += "5. **Remerciements personnalisés** - Envoyez des remerciements personnalisés aux top donateurs pour renforcer leur engagement.\n";
      
      return response;
    }
    
    default: {
      return `Je suis le Copilote IA de Nucleus Cause. Je peux vous aider avec :

- **📊 Statistiques** - "Montre-moi les statistiques" ou "Donne-moi un aperçu"
- **🏆 Top donateurs** - "Qui sont les top 10 donateurs ?"
- **💰 Dons récents** - "Quels sont les derniers dons ?"
- **📈 Segments** - "Montre la répartition par segment"
- **📝 Formulaires** - "Comment performent nos formulaires ?"
- **🔍 Recherche** - "Cherche le donateur Martin"
- **💡 Recommandations** - "Que me recommandes-tu ?"

Comment puis-je vous aider ?`;
    }
  }
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { message } = body;
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Message requis" },
        { status: 400 }
      );
    }
    
    // Analyser l'intention
    const { intent, params } = analyzeIntent(message);
    
    // Générer la réponse
    const response = await generateResponse(intent, params);
    
    return NextResponse.json({
      success: true,
      data: {
        message: response,
        intent,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in copilot chat:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du traitement de votre demande" },
      { status: 500 }
    );
  }
}

// GET pour récupérer les suggestions de questions
export async function GET() {
  const suggestions = [
    { text: "Montre-moi les statistiques", icon: "📊" },
    { text: "Qui sont les top 5 donateurs ?", icon: "🏆" },
    { text: "Quels sont les derniers dons ?", icon: "💰" },
    { text: "Montre la répartition par segment", icon: "📈" },
    { text: "Comment performent nos formulaires ?", icon: "📝" },
    { text: "Que me recommandes-tu ?", icon: "💡" },
  ];
  
  return NextResponse.json({
    success: true,
    data: { suggestions },
  });
}

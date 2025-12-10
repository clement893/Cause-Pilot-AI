import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Générer des prédictions et suggestions proactives
export async function GET() {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // 1. Donateurs à risque de churn (prédiction)
    const atRiskDonors = await prisma.donor.findMany({
      where: {
        status: "ACTIVE",
        lastDonationDate: {
          gte: sixMonthsAgo,
          lt: threeMonthsAgo,
        },
        donationCount: { gte: 2 },
        totalDonations: { gte: 50 },
      },
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
      orderBy: { totalDonations: "desc" },
      take: 10,
    });

    // Calculer le score de risque pour chaque donateur
    const atRiskWithScore = atRiskDonors.map(donor => {
      const daysSinceLastDonation = Math.floor(
        (now.getTime() - new Date(donor.lastDonationDate!).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Score de risque basé sur plusieurs facteurs
      let riskScore = 0;
      
      // Plus le temps depuis le dernier don est long, plus le risque est élevé
      if (daysSinceLastDonation > 150) riskScore += 30;
      else if (daysSinceLastDonation > 120) riskScore += 20;
      else riskScore += 10;
      
      // Les donateurs avec beaucoup de dons qui arrêtent sont à haut risque
      if (donor.donationCount >= 5) riskScore += 20;
      else if (donor.donationCount >= 3) riskScore += 10;
      
      // Les gros donateurs qui arrêtent sont prioritaires
      if (donor.totalDonations >= 500) riskScore += 25;
      else if (donor.totalDonations >= 200) riskScore += 15;
      
      return {
        ...donor,
        daysSinceLastDonation,
        riskScore: Math.min(riskScore, 100),
        riskLevel: riskScore >= 60 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW",
        suggestedAction: riskScore >= 60 
          ? "Appel personnel recommandé" 
          : "Email de réengagement suggéré",
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    // 2. Donateurs avec potentiel d'upgrade (prédiction)
    const upgradeCandidates = await prisma.donor.findMany({
      where: {
        status: "ACTIVE",
        donationCount: { gte: 3 },
        totalDonations: { gte: 100, lt: 1000 },
        lastDonationDate: { gte: threeMonthsAgo },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalDonations: true,
        donationCount: true,
        lastDonationDate: true,
      },
      orderBy: { totalDonations: "desc" },
      take: 10,
    });

    // Calculer le potentiel d'upgrade
    const upgradeWithPotential = upgradeCandidates.map(donor => {
      const avgDonation = donor.totalDonations / donor.donationCount;
      const suggestedRecurringAmount = Math.round(avgDonation / 12) * 12; // Arrondir au multiple de 12
      
      return {
        ...donor,
        avgDonation,
        suggestedRecurringAmount: Math.max(suggestedRecurringAmount, 10),
        potentialAnnualValue: suggestedRecurringAmount * 12,
        suggestedAction: `Proposer un don récurrent de ${suggestedRecurringAmount}$/mois`,
      };
    });

    // 3. Meilleur moment pour contacter (basé sur l'historique)
    const recentDonations = await prisma.donation.findMany({
      where: {
        status: "COMPLETED",
        donationDate: { gte: oneMonthAgo },
      },
      select: {
        donationDate: true,
        amount: true,
      },
    });

    // Analyser les patterns de dons
    const dayOfWeekStats: Record<number, { count: number; total: number }> = {};
    const hourStats: Record<number, { count: number; total: number }> = {};

    recentDonations.forEach(donation => {
      if (donation.donationDate) {
        const date = new Date(donation.donationDate);
        const day = date.getDay();
        const hour = date.getHours();

        if (!dayOfWeekStats[day]) dayOfWeekStats[day] = { count: 0, total: 0 };
        dayOfWeekStats[day].count++;
        dayOfWeekStats[day].total += donation.amount;

        if (!hourStats[hour]) hourStats[hour] = { count: 0, total: 0 };
        hourStats[hour].count++;
        hourStats[hour].total += donation.amount;
      }
    });

    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const bestDays = Object.entries(dayOfWeekStats)
      .map(([day, stats]) => ({
        day: dayNames[parseInt(day)],
        count: stats.count,
        avgAmount: stats.total / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const bestHours = Object.entries(hourStats)
      .map(([hour, stats]) => ({
        hour: `${hour}h`,
        count: stats.count,
        avgAmount: stats.total / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 4. Recommandations de montants optimaux
    const allDonations = await prisma.donation.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true },
      orderBy: { amount: "asc" },
    });

    const amounts = allDonations.map(d => d.amount);
    const avgAmount = amounts.length > 0 
      ? amounts.reduce((a, b) => a + b, 0) / amounts.length 
      : 0;
    const medianAmount = amounts.length > 0 
      ? amounts[Math.floor(amounts.length / 2)] 
      : 0;

    // Calculer les montants suggérés basés sur la distribution
    const suggestedAmounts = [
      Math.round(medianAmount * 0.5 / 5) * 5,
      Math.round(medianAmount / 5) * 5,
      Math.round(medianAmount * 1.5 / 5) * 5,
      Math.round(medianAmount * 2.5 / 5) * 5,
      Math.round(medianAmount * 5 / 10) * 10,
    ].filter((v, i, a) => a.indexOf(v) === i && v > 0);

    // 5. Campagnes suggérées
    const campaignSuggestions = [];

    // Vérifier si c'est la période de fin d'année
    if (now.getMonth() >= 9) {
      campaignSuggestions.push({
        type: "year_end",
        title: "Campagne de fin d'année",
        description: "30% des dons annuels sont faits en décembre. Lancez votre campagne maintenant.",
        priority: "HIGH",
        potentialImpact: "Augmentation de 20-40% des dons",
      });
    }

    // Vérifier les donateurs inactifs
    const inactiveCount = await prisma.donor.count({
      where: {
        status: "ACTIVE",
        lastDonationDate: { lt: sixMonthsAgo },
        totalDonations: { gte: 50 },
      },
    });

    if (inactiveCount > 10) {
      campaignSuggestions.push({
        type: "reactivation",
        title: "Campagne de réactivation",
        description: `${inactiveCount} donateurs inactifs avec un historique de dons significatif.`,
        priority: "MEDIUM",
        potentialImpact: `Récupération potentielle de ${Math.round(inactiveCount * 50)}$ à ${Math.round(inactiveCount * 150)}$`,
      });
    }

    // Vérifier le potentiel de dons récurrents
    const nonRecurringCount = await prisma.donor.count({
      where: {
        status: "ACTIVE",
        donationCount: { gte: 2 },
      },
    });

    if (nonRecurringCount > 20) {
      campaignSuggestions.push({
        type: "recurring",
        title: "Campagne dons récurrents",
        description: `${nonRecurringCount} donateurs fidèles pourraient passer au don récurrent.`,
        priority: "MEDIUM",
        potentialImpact: "Revenus prévisibles et stables",
      });
    }

    // 6. Insights globaux
    const totalDonors = await prisma.donor.count();
    const activeDonors = await prisma.donor.count({ where: { status: "ACTIVE" } });
    // Compter les donateurs avec au moins un don récurrent
    const recurringDonorIds = await prisma.donation.findMany({
      where: { isRecurring: true },
      select: { donorId: true },
      distinct: ['donorId'],
    });
    const recurringDonors = recurringDonorIds.length;
    
    const insights = {
      healthScore: Math.round(
        (activeDonors / Math.max(totalDonors, 1)) * 40 +
        (recurringDonors / Math.max(activeDonors, 1)) * 30 +
        (atRiskDonors.length < 5 ? 30 : atRiskDonors.length < 10 ? 20 : 10)
      ),
      recurringRate: totalDonors > 0 ? (recurringDonors / totalDonors) * 100 : 0,
      retentionRate: totalDonors > 0 ? (activeDonors / totalDonors) * 100 : 0,
      avgDonation: avgAmount,
      medianDonation: medianAmount,
    };

    return NextResponse.json({
      predictions: {
        atRiskDonors: atRiskWithScore,
        upgradeCandidates: upgradeWithPotential,
      },
      timing: {
        bestDays,
        bestHours,
      },
      recommendations: {
        suggestedAmounts,
        campaignSuggestions,
      },
      insights,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Predictions API error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des prédictions" },
      { status: 500 }
    );
  }
}

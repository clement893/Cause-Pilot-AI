import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Types pour les rapports
interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface DonationMetrics {
  totalAmount: number;
  donationCount: number;
  averageDonation: number;
  recurringAmount: number;
  oneTimeAmount: number;
  largestDonation: number;
}

interface DonorMetrics {
  totalDonors: number;
  newDonors: number;
  returningDonors: number;
  lapsedDonors: number;
  retentionRate: number;
  averageLifetimeValue: number;
}

interface CampaignMetrics {
  activeCampaigns: number;
  completedCampaigns: number;
  totalRaised: number;
  averageGoalCompletion: number;
  topCampaigns: Array<{
    name: string;
    raised: number;
    goal: number;
    percentage: number;
  }>;
}

// GET - Générer un rapport
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "monthly";
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    // Calculer les périodes
    const periods = calculatePeriods(type, year, month);
    
    // Récupérer les métriques de dons
    const donationMetrics = await getDonationMetrics(periods.current);
    const previousDonationMetrics = await getDonationMetrics(periods.previous);
    
    // Récupérer les métriques de donateurs
    const donorMetrics = await getDonorMetrics(periods.current);
    
    // Récupérer les métriques de campagnes
    const campaignMetrics = await getCampaignMetrics(periods.current);
    
    // Calculer la comparaison Y/Y
    const yearOverYear = calculateYearOverYear(donationMetrics, previousDonationMetrics);
    
    // Récupérer les tendances mensuelles
    const monthlyTrends = await getMonthlyTrends(year);
    
    // Récupérer les top donateurs
    const topDonors = await getTopDonors(periods.current, 10);
    
    // Récupérer la répartition par source
    const sourceBreakdown = await getSourceBreakdown(periods.current);

    const report = {
      metadata: {
        type,
        period: periods.current.label,
        generatedAt: new Date().toISOString(),
        year,
        month: type === "monthly" ? month : undefined,
      },
      summary: {
        totalRaised: donationMetrics.totalAmount,
        totalDonations: donationMetrics.donationCount,
        totalDonors: donorMetrics.totalDonors,
        newDonors: donorMetrics.newDonors,
        averageDonation: donationMetrics.averageDonation,
        retentionRate: donorMetrics.retentionRate,
      },
      donationMetrics,
      donorMetrics,
      campaignMetrics,
      yearOverYear,
      monthlyTrends,
      topDonors,
      sourceBreakdown,
      highlights: generateHighlights(donationMetrics, donorMetrics, yearOverYear),
      recommendations: generateRecommendations(donationMetrics, donorMetrics, campaignMetrics),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Erreur génération rapport:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport" },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires

function calculatePeriods(type: string, year: number, month: number): { current: ReportPeriod; previous: ReportPeriod } {
  let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;
  let currentLabel: string, previousLabel: string;

  switch (type) {
    case "monthly":
      currentStart = new Date(year, month - 1, 1);
      currentEnd = new Date(year, month, 0, 23, 59, 59);
      previousStart = new Date(year - 1, month - 1, 1);
      previousEnd = new Date(year - 1, month, 0, 23, 59, 59);
      currentLabel = `${getMonthName(month)} ${year}`;
      previousLabel = `${getMonthName(month)} ${year - 1}`;
      break;
    case "quarterly":
      const quarter = Math.ceil(month / 3);
      currentStart = new Date(year, (quarter - 1) * 3, 1);
      currentEnd = new Date(year, quarter * 3, 0, 23, 59, 59);
      previousStart = new Date(year - 1, (quarter - 1) * 3, 1);
      previousEnd = new Date(year - 1, quarter * 3, 0, 23, 59, 59);
      currentLabel = `T${quarter} ${year}`;
      previousLabel = `T${quarter} ${year - 1}`;
      break;
    case "annual":
    default:
      currentStart = new Date(year, 0, 1);
      currentEnd = new Date(year, 11, 31, 23, 59, 59);
      previousStart = new Date(year - 1, 0, 1);
      previousEnd = new Date(year - 1, 11, 31, 23, 59, 59);
      currentLabel = `Année ${year}`;
      previousLabel = `Année ${year - 1}`;
      break;
  }

  return {
    current: { startDate: currentStart, endDate: currentEnd, label: currentLabel },
    previous: { startDate: previousStart, endDate: previousEnd, label: previousLabel },
  };
}

function getMonthName(month: number): string {
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  return months[month - 1];
}

async function getDonationMetrics(period: ReportPeriod): Promise<DonationMetrics> {
  const donations = await prisma.donation.findMany({
    where: {
      donationDate: {
        gte: period.startDate,
        lte: period.endDate,
      },
      status: "COMPLETED",
    },
    select: {
      amount: true,
      isRecurring: true,
    },
  });

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const recurringAmount = donations.filter(d => d.isRecurring).reduce((sum, d) => sum + d.amount, 0);
  const oneTimeAmount = donations.filter(d => !d.isRecurring).reduce((sum, d) => sum + d.amount, 0);
  const largestDonation = donations.length > 0 ? Math.max(...donations.map(d => d.amount)) : 0;

  return {
    totalAmount,
    donationCount: donations.length,
    averageDonation: donations.length > 0 ? totalAmount / donations.length : 0,
    recurringAmount,
    oneTimeAmount,
    largestDonation,
  };
}

async function getDonorMetrics(period: ReportPeriod): Promise<DonorMetrics> {
  // Donateurs totaux ayant donné pendant la période
  const donorsInPeriod = await prisma.donation.findMany({
    where: {
      donationDate: {
        gte: period.startDate,
        lte: period.endDate,
      },
      status: "COMPLETED",
    },
    select: {
      donorId: true,
    },
    distinct: ["donorId"],
  });

  const totalDonors = donorsInPeriod.length;

  // Nouveaux donateurs (premier don pendant la période)
  const newDonors = await prisma.donor.count({
    where: {
      firstDonationDate: {
        gte: period.startDate,
        lte: period.endDate,
      },
    },
  });

  // Donateurs ayant donné l'année précédente
  const previousYearStart = new Date(period.startDate);
  previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);
  const previousYearEnd = new Date(period.endDate);
  previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);

  const previousYearDonors = await prisma.donation.findMany({
    where: {
      donationDate: {
        gte: previousYearStart,
        lte: previousYearEnd,
      },
      status: "COMPLETED",
    },
    select: {
      donorId: true,
    },
    distinct: ["donorId"],
  });

  // Donateurs qui ont donné les deux années
  const previousDonorIds = new Set(previousYearDonors.map(d => d.donorId));
  const currentDonorIds = new Set(donorsInPeriod.map(d => d.donorId));
  const returningDonors = [...currentDonorIds].filter(id => id && previousDonorIds.has(id)).length;

  // Donateurs inactifs (n'ont pas donné cette période mais ont donné avant)
  const lapsedDonors = previousYearDonors.length - returningDonors;

  // Taux de rétention
  const retentionRate = previousYearDonors.length > 0 
    ? (returningDonors / previousYearDonors.length) * 100 
    : 0;

  // Valeur vie moyenne
  const allDonors = await prisma.donor.findMany({
    where: {
      id: { in: donorsInPeriod.map(d => d.donorId).filter((id): id is string => id !== null) },
    },
    select: {
      totalDonations: true,
    },
  });
  const averageLifetimeValue = allDonors.length > 0
    ? allDonors.reduce((sum, d) => sum + d.totalDonations, 0) / allDonors.length
    : 0;

  return {
    totalDonors,
    newDonors,
    returningDonors,
    lapsedDonors,
    retentionRate,
    averageLifetimeValue,
  };
}

async function getCampaignMetrics(period: ReportPeriod): Promise<CampaignMetrics> {
  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { startDate: { lte: period.endDate }, endDate: { gte: period.startDate } },
        { startDate: { gte: period.startDate, lte: period.endDate } },
      ],
    },
    select: {
      id: true,
      name: true,
      goalAmount: true,
      totalRaised: true,
      status: true,
    },
  });

  const activeCampaigns = campaigns.filter(c => c.status === "ACTIVE").length;
  const completedCampaigns = campaigns.filter(c => c.status === "COMPLETED").length;
  const totalRaised = campaigns.reduce((sum, c) => sum + c.totalRaised, 0);
  
  const campaignsWithGoal = campaigns.filter(c => (c.goalAmount ?? 0) > 0);
  const averageGoalCompletion = campaignsWithGoal.length > 0
    ? campaignsWithGoal.reduce((sum, c) => sum + (c.totalRaised / (c.goalAmount ?? 1)) * 100, 0) / campaignsWithGoal.length
    : 0;

  const topCampaigns = campaigns
    .sort((a, b) => b.totalRaised - a.totalRaised)
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      raised: c.totalRaised,
      goal: c.goalAmount ?? 0,
      percentage: (c.goalAmount ?? 0) > 0 ? (c.totalRaised / (c.goalAmount ?? 1)) * 100 : 0,
    }));

  return {
    activeCampaigns,
    completedCampaigns,
    totalRaised,
    averageGoalCompletion,
    topCampaigns,
  };
}

function calculateYearOverYear(
  current: DonationMetrics,
  previous: DonationMetrics
) {
  const growthRate = previous.totalAmount > 0
    ? ((current.totalAmount - previous.totalAmount) / previous.totalAmount) * 100
    : 0;

  const donorGrowthRate = previous.donationCount > 0
    ? ((current.donationCount - previous.donationCount) / previous.donationCount) * 100
    : 0;

  return {
    currentPeriod: current,
    previousPeriod: previous,
    growthRate,
    donorGrowthRate,
  };
}

async function getMonthlyTrends(year: number) {
  const trends = [];
  
  for (let month = 1; month <= 12; month++) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const donations = await prisma.donation.aggregate({
      where: {
        donationDate: { gte: startDate, lte: endDate },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const previousYearDonations = await prisma.donation.aggregate({
      where: {
        donationDate: {
          gte: new Date(year - 1, month - 1, 1),
          lte: new Date(year - 1, month, 0, 23, 59, 59),
        },
        status: "COMPLETED",
      },
      _sum: { amount: true },
    });

    trends.push({
      month: getMonthName(month),
      monthNumber: month,
      amount: donations._sum.amount || 0,
      count: donations._count.id || 0,
      previousYearAmount: previousYearDonations._sum.amount || 0,
    });
  }

  return trends;
}

async function getTopDonors(period: ReportPeriod, limit: number) {
  const topDonors = await prisma.donation.groupBy({
    by: ["donorId"],
    where: {
      donationDate: { gte: period.startDate, lte: period.endDate },
      status: "COMPLETED",
      donorId: { not: { equals: undefined } },
    },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const donorIds = topDonors.map(d => d.donorId).filter((id): id is string => id !== null);
  const donors = await prisma.donor.findMany({
    where: { id: { in: donorIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  const donorMap = new Map(donors.map(d => [d.id, d]));

  return topDonors.map(d => {
    const donor = d.donorId ? donorMap.get(d.donorId) : null;
    return {
      name: donor ? `${donor.firstName} ${donor.lastName}` : "Anonyme",
      email: donor?.email || "",
      totalAmount: d._sum.amount || 0,
      donationCount: d._count.id || 0,
    };
  });
}

async function getSourceBreakdown(period: ReportPeriod) {
  const donations = await prisma.donation.groupBy({
    by: ["paymentMethod"],
    where: {
      donationDate: { gte: period.startDate, lte: period.endDate },
      status: "COMPLETED",
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  const total = donations.reduce((sum, d) => sum + (d._sum.amount || 0), 0);

  return donations.map(d => ({
    source: d.paymentMethod || "Autre",
    amount: d._sum.amount || 0,
    count: d._count.id || 0,
    percentage: total > 0 ? ((d._sum.amount || 0) / total) * 100 : 0,
  }));
}

function generateHighlights(
  donations: DonationMetrics,
  donors: DonorMetrics,
  yoy: { growthRate: number; donorGrowthRate: number }
): string[] {
  const highlights: string[] = [];

  if (yoy.growthRate > 0) {
    highlights.push(`Croissance de ${yoy.growthRate.toFixed(1)}% par rapport à l'année précédente`);
  } else if (yoy.growthRate < 0) {
    highlights.push(`Baisse de ${Math.abs(yoy.growthRate).toFixed(1)}% par rapport à l'année précédente`);
  }

  if (donors.newDonors > 0) {
    highlights.push(`${donors.newDonors} nouveaux donateurs acquis`);
  }

  if (donors.retentionRate >= 70) {
    highlights.push(`Excellent taux de rétention: ${donors.retentionRate.toFixed(1)}%`);
  } else if (donors.retentionRate >= 50) {
    highlights.push(`Bon taux de rétention: ${donors.retentionRate.toFixed(1)}%`);
  } else if (donors.retentionRate > 0) {
    highlights.push(`Taux de rétention à améliorer: ${donors.retentionRate.toFixed(1)}%`);
  }

  if (donations.largestDonation >= 1000) {
    highlights.push(`Don majeur reçu: ${donations.largestDonation.toLocaleString("fr-CA")} $`);
  }

  const recurringPercentage = donations.totalAmount > 0 
    ? (donations.recurringAmount / donations.totalAmount) * 100 
    : 0;
  if (recurringPercentage >= 30) {
    highlights.push(`${recurringPercentage.toFixed(1)}% des dons sont récurrents`);
  }

  return highlights;
}

function generateRecommendations(
  donations: DonationMetrics,
  donors: DonorMetrics,
  campaigns: CampaignMetrics
): string[] {
  const recommendations: string[] = [];

  if (donors.retentionRate < 50) {
    recommendations.push("Mettre en place une campagne de réactivation pour les donateurs inactifs");
  }

  const recurringPercentage = donations.totalAmount > 0 
    ? (donations.recurringAmount / donations.totalAmount) * 100 
    : 0;
  if (recurringPercentage < 20) {
    recommendations.push("Promouvoir les dons récurrents pour stabiliser les revenus");
  }

  if (campaigns.averageGoalCompletion < 50) {
    recommendations.push("Revoir les objectifs de campagne ou intensifier les efforts de collecte");
  }

  if (donors.newDonors < donors.lapsedDonors) {
    recommendations.push("Augmenter les efforts d'acquisition de nouveaux donateurs");
  }

  if (donations.averageDonation < 100) {
    recommendations.push("Tester des montants suggérés plus élevés sur les formulaires");
  }

  return recommendations;
}

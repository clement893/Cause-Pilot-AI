import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma-org";
import { getOrganizationId } from "@/lib/organization";

// GET - Récupérer les données du dashboard amélioré
export async function GET(request: NextRequest) {
  try {
    // Récupérer l'organisation depuis les headers ou query params
    const organizationId = getOrganizationId(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    // Obtenir l'instance Prisma appropriée pour cette organisation
    const prisma = await getPrisma(request);
    
    // Construire le filtre de base avec organisation
    const baseDonorWhere = { organizationId };
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // Métriques des donateurs
    const totalDonors = await prisma.donor.count({ where: baseDonorWhere });
    const newDonorsThisMonth = await prisma.donor.count({
      where: { ...baseDonorWhere, createdAt: { gte: startOfMonth } },
    });
    const newDonorsLastMonth = await prisma.donor.count({
      where: {
        ...baseDonorWhere,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });
    const activeDonors = await prisma.donor.count({
      where: { ...baseDonorWhere, status: "ACTIVE" },
    });
    // Compter les donateurs avec au moins un don récurrent (filtrés par organisation)
    const recurringDonorIds = await prisma.donation.findMany({
      where: {
        isRecurring: true,
        donor: { organizationId },
      },
      select: { donorId: true },
      distinct: ['donorId'],
    });
    const recurringDonorsCount = recurringDonorIds.length;

    // Donateurs inactifs (pas de don depuis 6 mois mais ont déjà donné)
    const inactiveDonors = await prisma.donor.count({
      where: {
        ...baseDonorWhere,
        status: "ACTIVE",
        lastDonationDate: { lt: sixMonthsAgo },
        donationCount: { gt: 0 },
      },
    });

    // Métriques des dons (filtrés par organisation via le donateur)
    const donations = await prisma.donation.findMany({
      where: {
        status: "COMPLETED",
        donor: { organizationId },
      },
      select: { amount: true, createdAt: true, donationDate: true, isRecurring: true },
    });

    const totalDonationsAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonationsCount = donations.length;
    
    // Dons par période
    const donationsToday = donations.filter((d) => 
      (d.donationDate || d.createdAt) >= startOfDay
    );
    const donationsTodayAmount = donationsToday.reduce((sum, d) => sum + d.amount, 0);
    
    const donationsThisWeek = donations.filter((d) => 
      (d.donationDate || d.createdAt) >= startOfWeek
    );
    const donationsThisWeekAmount = donationsThisWeek.reduce((sum, d) => sum + d.amount, 0);
    
    const donationsThisMonth = donations.filter((d) => 
      (d.donationDate || d.createdAt) >= startOfMonth
    );
    const donationsThisMonthAmount = donationsThisMonth.reduce((sum, d) => sum + d.amount, 0);
    
    const donationsLastMonth = donations.filter((d) => 
      (d.donationDate || d.createdAt) >= startOfLastMonth && 
      (d.donationDate || d.createdAt) <= endOfLastMonth
    );
    const donationsLastMonthAmount = donationsLastMonth.reduce((sum, d) => sum + d.amount, 0);
    
    const donationsThisYear = donations.filter((d) => 
      (d.donationDate || d.createdAt) >= startOfYear
    );
    const donationsThisYearAmount = donationsThisYear.reduce((sum, d) => sum + d.amount, 0);
    
    const recurringDonations = donations.filter((d) => d.isRecurring).length;
    const averageDonation = donations.length > 0 ? totalDonationsAmount / donations.length : 0;

    // Métriques des campagnes
    const totalCampaigns = await prisma.campaign.count();
    const activeCampaigns = await prisma.campaign.count({
      where: { status: "ACTIVE" },
    });
    
    const campaignsData = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        goalAmount: true,
        totalRaised: true,
        donorCount: true,
        endDate: true,
        primaryColor: true,
      },
      orderBy: { totalRaised: "desc" },
      take: 5,
    });

    // Objectif mensuel (somme des objectifs des campagnes actives)
    const monthlyGoalTarget = campaignsData.reduce((sum, c) => sum + (c.goalAmount || 0), 0);
    const monthlyGoalProgress = monthlyGoalTarget > 0 
      ? (donationsThisMonthAmount / monthlyGoalTarget) * 100 
      : 0;

    // Métriques des formulaires
    const totalForms = await prisma.donationForm.count();
    const activeForms = await prisma.donationForm.count({
      where: { status: "PUBLISHED" },
    });

    // Dons récents (filtrés par organisation)
    const recentDonations = await prisma.donation.findMany({
      where: {
        status: "COMPLETED",
        ...(organizationId ? { Donor: { organizationId } } : {}),
      },
      include: {
        Donor: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Top donateurs (filtrés par organisation)
    const topDonors = await prisma.donor.findMany({
      where: baseDonorWhere,
      orderBy: { totalDonations: "desc" },
      take: 5,
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
    });

    // Donateurs à relancer (inactifs avec historique de dons importants)
    const donorsToReengage = await prisma.donor.findMany({
      where: {
        ...baseDonorWhere,
        status: "ACTIVE",
        lastDonationDate: { lt: sixMonthsAgo },
        totalDonations: { gte: 50 },
      },
      orderBy: { totalDonations: "desc" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalDonations: true,
        lastDonationDate: true,
        donationCount: true,
        segment: true,
      },
    });

    // Nouveaux donateurs récents (filtrés par organisation)
    const recentDonors = await prisma.donor.findMany({
      where: baseDonorWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        totalDonations: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Données pour le graphique des dons par mois (12 derniers mois)
    const monthlyDonations = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthTotal = donations
        .filter((d) => {
          const date = d.donationDate || d.createdAt;
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, d) => sum + d.amount, 0);
      const monthCount = donations.filter((d) => {
        const date = d.donationDate || d.createdAt;
        return date >= monthStart && date <= monthEnd;
      }).length;
      monthlyDonations.push({
        month: monthStart.toLocaleDateString("fr-CA", { month: "short", year: "2-digit" }),
        fullMonth: monthStart.toLocaleDateString("fr-CA", { month: "long", year: "numeric" }),
        amount: monthTotal,
        count: monthCount,
      });
    }

    // Répartition par segment de donateurs (filtrés par organisation)
    const donorSegments = await prisma.donor.groupBy({
      by: ["segment"],
      _count: { id: true },
      where: baseDonorWhere,
    });

    // Calcul des variations
    const donorGrowth = newDonorsLastMonth > 0
      ? ((newDonorsThisMonth - newDonorsLastMonth) / newDonorsLastMonth) * 100
      : newDonorsThisMonth > 0 ? 100 : 0;
    const donationGrowth = donationsLastMonthAmount > 0
      ? ((donationsThisMonthAmount - donationsLastMonthAmount) / donationsLastMonthAmount) * 100
      : donationsThisMonthAmount > 0 ? 100 : 0;

    // Alertes et notifications
    const alerts = [];
    
    // Alerte: donateurs inactifs
    if (inactiveDonors > 0) {
      alerts.push({
        id: "inactive-donors",
        type: "warning",
        title: "Donateurs inactifs",
        message: `${inactiveDonors} donateur(s) n'ont pas donné depuis 6 mois`,
        action: "/donors?status=inactive",
        priority: inactiveDonors > 10 ? "high" : "medium",
      });
    }

    // Alerte: campagnes proches de la fin
    const endingSoon = campaignsData.filter(c => {
      if (!c.endDate) return false;
      const daysLeft = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft > 0;
    });
    
    if (endingSoon.length > 0) {
      alerts.push({
        id: "campaigns-ending",
        type: "info",
        title: "Campagnes se terminant bientôt",
        message: `${endingSoon.length} campagne(s) se terminent dans les 7 prochains jours`,
        action: "/campaigns",
        priority: "medium",
      });
    }

    // Alerte: objectif mensuel
    if (monthlyGoalProgress >= 100) {
      alerts.push({
        id: "goal-reached",
        type: "success",
        title: "Objectif atteint !",
        message: "Félicitations ! L'objectif mensuel a été atteint",
        action: "/dashboard",
        priority: "low",
      });
    } else if (monthlyGoalProgress >= 75) {
      alerts.push({
        id: "goal-75",
        type: "success",
        title: "75% de l'objectif atteint",
        message: "Vous êtes sur la bonne voie pour atteindre l'objectif mensuel",
        action: "/dashboard",
        priority: "low",
      });
    }

    // Alerte: nouveaux donateurs
    if (newDonorsThisMonth > 0) {
      alerts.push({
        id: "new-donors",
        type: "info",
        title: "Nouveaux donateurs",
        message: `${newDonorsThisMonth} nouveau(x) donateur(s) ce mois-ci`,
        action: "/donors?sort=newest",
        priority: "low",
      });
    }

    // Suggestions CausePilot
    const suggestions = [];

    // Suggestion: relancer les donateurs inactifs
    if (donorsToReengage.length > 0) {
      suggestions.push({
        id: "reengage-donors",
        type: "action",
        title: "Relancer les donateurs inactifs",
        message: `${donorsToReengage.length} donateur(s) avec un historique de ${donorsToReengage.reduce((sum, d) => sum + d.totalDonations, 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })} n'ont pas donné depuis 6 mois`,
        action: "/donors?status=inactive",
        impact: "high",
      });
    }

    // Suggestion: campagne de fin d'année (si on est en Q4)
    if (now.getMonth() >= 9 && now.getMonth() <= 11) {
      const hasYearEndCampaign = campaignsData.some(c => 
        c.name.toLowerCase().includes("fin d'année") || 
        c.name.toLowerCase().includes("noel") ||
        c.name.toLowerCase().includes("noël")
      );
      if (!hasYearEndCampaign) {
        suggestions.push({
          id: "year-end-campaign",
          type: "opportunity",
          title: "Campagne de fin d'année",
          message: "C'est la période idéale pour lancer une campagne de fin d'année. 30% des dons annuels sont faits en décembre.",
          action: "/campaigns/new",
          impact: "high",
        });
      }
    }

    // Suggestion: augmenter les dons récurrents
    const recurringRate = totalDonors > 0 ? (recurringDonorsCount / totalDonors) * 100 : 0;
    if (recurringRate < 20) {
      suggestions.push({
        id: "increase-recurring",
        type: "growth",
        title: "Augmenter les dons récurrents",
        message: `Seulement ${recurringRate.toFixed(1)}% de vos donateurs sont récurrents. L'objectif idéal est 30%.`,
        action: "/donors?recurring=false",
        impact: "medium",
      });
    }

    return NextResponse.json({
      // KPIs principaux
      kpis: {
        totalDonors,
        newDonorsThisMonth,
        donorGrowth: Math.round(donorGrowth * 10) / 10,
        activeDonors,
        inactiveDonors,
        recurringDonors: recurringDonorsCount,
        totalDonations: totalDonationsAmount,
        totalDonationsCount,
        donationsThisMonth: donationsThisMonthAmount,
        donationsThisYear: donationsThisYearAmount,
        donationGrowth: Math.round(donationGrowth * 10) / 10,
        averageDonation: Math.round(averageDonation * 100) / 100,
        recurringDonations,
        totalCampaigns,
        activeCampaigns,
        totalForms,
        activeForms,
      },
      
      // Période actuelle
      period: {
        today: {
          amount: donationsTodayAmount,
          count: donationsToday.length,
        },
        week: {
          amount: donationsThisWeekAmount,
          count: donationsThisWeek.length,
        },
        month: {
          amount: donationsThisMonthAmount,
          count: donationsThisMonth.length,
        },
        year: {
          amount: donationsThisYearAmount,
          count: donationsThisYear.length,
        },
      },
      
      // Objectif mensuel
      monthlyGoal: {
        target: monthlyGoalTarget,
        current: donationsThisMonthAmount,
        progress: Math.min(monthlyGoalProgress, 100),
        remaining: Math.max(0, monthlyGoalTarget - donationsThisMonthAmount),
      },
      
      // Graphiques
      charts: {
        monthlyDonations,
        donorSegments: donorSegments.map((s) => ({
          segment: s.segment || "Non défini",
          count: s._count.id,
        })),
      },
      
      // Listes
      recent: {
        donations: recentDonations.map((d) => ({
          id: d.id,
          amount: d.amount,
          donorName: d.Donor
            ? `${d.Donor.firstName} ${d.Donor.lastName}`
            : "Anonyme",
          donorEmail: d.Donor?.email,
          date: d.createdAt,
          isRecurring: d.isRecurring,
          isAnonymous: d.isAnonymous,
        })),
        donors: recentDonors,
        campaigns: campaignsData.map((c) => ({
          ...c,
          progress: c.goalAmount ? (c.totalRaised / c.goalAmount) * 100 : 0,
          daysRemaining: c.endDate 
            ? Math.max(0, Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : null,
        })),
      },
      
      // Donateurs à relancer
      donorsToReengage,
      topDonors,
      
      // Alertes et suggestions
      alerts,
      suggestions,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données du dashboard" },
      { status: 500 }
    );
  }
}

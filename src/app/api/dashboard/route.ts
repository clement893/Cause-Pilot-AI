import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les données du dashboard
export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Métriques des donateurs
    const totalDonors = await prisma.donor.count();
    const newDonorsThisMonth = await prisma.donor.count({
      where: { createdAt: { gte: startOfMonth } },
    });
    const newDonorsLastMonth = await prisma.donor.count({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });
    const activeDonors = await prisma.donor.count({
      where: { status: "ACTIVE" },
    });

    // Métriques des dons
    const donations = await prisma.donation.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true, createdAt: true, isRecurring: true },
    });

    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const donationsThisMonth = donations
      .filter((d) => d.createdAt >= startOfMonth)
      .reduce((sum, d) => sum + d.amount, 0);
    const donationsLastMonth = donations
      .filter((d) => d.createdAt >= startOfLastMonth && d.createdAt <= endOfLastMonth)
      .reduce((sum, d) => sum + d.amount, 0);
    const donationsThisYear = donations
      .filter((d) => d.createdAt >= startOfYear)
      .reduce((sum, d) => sum + d.amount, 0);
    const recurringDonations = donations.filter((d) => d.isRecurring).length;
    const averageDonation = donations.length > 0 ? totalDonations / donations.length : 0;

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
      },
      orderBy: { totalRaised: "desc" },
      take: 5,
    });

    // Métriques des formulaires
    const totalForms = await prisma.donationForm.count();
    const activeForms = await prisma.donationForm.count({
      where: { status: "ACTIVE" },
    });

    // Dons récents
    const recentDonations = await prisma.donation.findMany({
      where: { status: "COMPLETED" },
      include: {
        donor: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Nouveaux donateurs récents
    const recentDonors = await prisma.donor.findMany({
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
        .filter((d) => d.createdAt >= monthStart && d.createdAt <= monthEnd)
        .reduce((sum, d) => sum + d.amount, 0);
      const monthCount = donations.filter(
        (d) => d.createdAt >= monthStart && d.createdAt <= monthEnd
      ).length;
      monthlyDonations.push({
        month: monthStart.toLocaleDateString("fr-CA", { month: "short", year: "2-digit" }),
        amount: monthTotal,
        count: monthCount,
      });
    }

    // Répartition par segment de donateurs
    const donorSegments = await prisma.donor.groupBy({
      by: ["segment"],
      _count: { id: true },
    });

    // Calcul des variations
    const donorGrowth = newDonorsLastMonth > 0
      ? ((newDonorsThisMonth - newDonorsLastMonth) / newDonorsLastMonth) * 100
      : newDonorsThisMonth > 0 ? 100 : 0;
    const donationGrowth = donationsLastMonth > 0
      ? ((donationsThisMonth - donationsLastMonth) / donationsLastMonth) * 100
      : donationsThisMonth > 0 ? 100 : 0;

    return NextResponse.json({
      // KPIs principaux
      kpis: {
        totalDonors,
        newDonorsThisMonth,
        donorGrowth: Math.round(donorGrowth * 10) / 10,
        activeDonors,
        totalDonations,
        donationsThisMonth,
        donationsThisYear,
        donationGrowth: Math.round(donationGrowth * 10) / 10,
        averageDonation: Math.round(averageDonation * 100) / 100,
        recurringDonations,
        totalCampaigns,
        activeCampaigns,
        totalForms,
        activeForms,
      },
      // Graphiques
      charts: {
        monthlyDonations,
        donorSegments: donorSegments.map((s) => ({
          segment: s.segment || "Non défini",
          count: s._count.id,
        })),
      },
      // Listes récentes
      recent: {
        donations: recentDonations.map((d) => ({
          id: d.id,
          amount: d.amount,
          donorName: d.donor
            ? `${d.donor.firstName} ${d.donor.lastName}`
            : "Anonyme",
          donorEmail: d.donor?.email,
          date: d.createdAt,
          isRecurring: d.isRecurring,
          isAnonymous: d.isAnonymous,
        })),
        donors: recentDonors,
        campaigns: campaignsData.map((c) => ({
          ...c,
          progress: c.goalAmount ? (c.totalRaised / c.goalAmount) * 100 : 0,
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données du dashboard" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Statistiques globales des campagnes
export async function GET() {
  try {
    // Statistiques globales
    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      campaigns,
    ] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
      prisma.campaign.count({ where: { status: "COMPLETED" } }),
      prisma.campaign.findMany({
        select: {
          totalRaised: true,
          donationCount: true,
          donorCount: true,
          goalAmount: true,
          status: true,
        },
      }),
    ]);

    // Calculer les totaux
    const totalRaised = campaigns.reduce((sum, c) => sum + c.totalRaised, 0);
    const totalDonations = campaigns.reduce((sum, c) => sum + c.donationCount, 0);
    const totalDonors = campaigns.reduce((sum, c) => sum + c.donorCount, 0);
    const totalGoal = campaigns.reduce((sum, c) => sum + (c.goalAmount || 0), 0);

    // Campagnes par statut
    const byStatus = await prisma.campaign.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Campagnes par type
    const byType = await prisma.campaign.groupBy({
      by: ["campaignType"],
      _count: { id: true },
      _sum: { totalRaised: true },
    });

    // Top 5 campagnes par montant collecté
    const topCampaigns = await prisma.campaign.findMany({
      orderBy: { totalRaised: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        totalRaised: true,
        goalAmount: true,
        donorCount: true,
        status: true,
      },
    });

    // Campagnes actives avec progression
    const activeCampaignsWithProgress = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      orderBy: { totalRaised: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        totalRaised: true,
        goalAmount: true,
        donorCount: true,
        endDate: true,
      },
    });

    // Calculer la progression pour chaque campagne active
    const activeCampaignsProgress = activeCampaignsWithProgress.map((c) => ({
      ...c,
      progress: c.goalAmount ? Math.min((c.totalRaised / c.goalAmount) * 100, 100) : 0,
      daysRemaining: c.endDate
        ? Math.max(
            0,
            Math.ceil(
              (new Date(c.endDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null,
    }));

    return NextResponse.json({
      overview: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        draftCampaigns: totalCampaigns - activeCampaigns - completedCampaigns,
        totalRaised,
        totalDonations,
        totalDonors,
        totalGoal,
        overallProgress: totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0,
        averagePerCampaign: totalCampaigns > 0 ? totalRaised / totalCampaigns : 0,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      byType: byType.map((t) => ({
        type: t.campaignType,
        count: t._count.id,
        totalRaised: t._sum.totalRaised || 0,
      })),
      topCampaigns,
      activeCampaignsProgress,
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign stats" },
      { status: 500 }
    );
  }
}

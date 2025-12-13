import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma-org";
import { getOrganizationId } from "@/lib/organization";

// GET /api/donors/stats - Statistiques globales des donateurs
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
    const baseWhere = { organizationId };
    
    // Statistiques de base
    const [
      totalDonors,
      activeDonors,
      inactiveDonors,
      lapsedDonors,
      newDonorsThisMonth,
      newDonorsLastMonth,
    ] = await Promise.all([
      prisma.donor.count({ where: baseWhere }),
      prisma.donor.count({ where: { ...baseWhere, status: "ACTIVE" } }),
      prisma.donor.count({ where: { ...baseWhere, status: "INACTIVE" } }),
      prisma.donor.count({ where: { ...baseWhere, status: "LAPSED" } }),
      prisma.donor.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.donor.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);
    
    // Statistiques par type
    const donorsByType = await prisma.donor.groupBy({
      by: ["donorType"],
      _count: { id: true },
      where: baseWhere,
    });
    
    // Statistiques par segment
    const donorsBySegment = await prisma.donor.groupBy({
      by: ["segment"],
      _count: { id: true },
      where: { ...baseWhere, segment: { not: null } },
    });
    
    // Statistiques de dons
    const donationStats = await prisma.donor.aggregate({
      where: baseWhere,
      _sum: { totalDonations: true },
      _avg: { totalDonations: true, averageDonation: true },
      _max: { highestDonation: true },
    });
    
    // Top donateurs
    const topDonors = await prisma.donor.findMany({
      where: { ...baseWhere, totalDonations: { gt: 0 } },
      orderBy: { totalDonations: "desc" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalDonations: true,
        donationCount: true,
        lastDonationDate: true,
      },
    });
    
    // Donateurs récents
    const recentDonors = await prisma.donor.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        source: true,
      },
    });
    
    // Statistiques de consentement
    const consentStats = await Promise.all([
      prisma.donor.count({ where: { ...baseWhere, consentEmail: true } }),
      prisma.donor.count({ where: { ...baseWhere, consentPhone: true } }),
      prisma.donor.count({ where: { ...baseWhere, consentMail: true } }),
    ]);
    
    // Calculer le taux de croissance
    const growthRate = newDonorsLastMonth > 0
      ? ((newDonorsThisMonth - newDonorsLastMonth) / newDonorsLastMonth) * 100
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalDonors,
          activeDonors,
          inactiveDonors,
          lapsedDonors,
          newDonorsThisMonth,
          newDonorsLastMonth,
          growthRate: Math.round(growthRate * 100) / 100,
        },
        byType: donorsByType.map((item) => ({
          type: item.donorType,
          count: item._count.id,
        })),
        bySegment: donorsBySegment.map((item) => ({
          segment: item.segment,
          count: item._count.id,
        })),
        donations: {
          totalAmount: donationStats._sum.totalDonations || 0,
          averagePerDonor: Math.round((donationStats._avg.totalDonations || 0) * 100) / 100,
          averageDonation: Math.round((donationStats._avg.averageDonation || 0) * 100) / 100,
          highestDonation: donationStats._max.highestDonation || 0,
        },
        consent: {
          email: consentStats[0],
          phone: consentStats[1],
          mail: consentStats[2],
          emailRate: totalDonors > 0 ? Math.round((consentStats[0] / totalDonors) * 100) : 0,
          phoneRate: totalDonors > 0 ? Math.round((consentStats[1] / totalDonors) * 100) : 0,
          mailRate: totalDonors > 0 ? Math.round((consentStats[2] / totalDonors) * 100) : 0,
        },
        topDonors,
        recentDonors,
      },
    });
  } catch (error) {
    console.error("Error fetching donor stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch donor statistics" },
      { status: 500 }
    );
  }
}

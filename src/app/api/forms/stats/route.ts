import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Statistiques globales des formulaires
export async function GET() {
  try {
    // Statistiques globales
    const [
      totalForms,
      publishedForms,
      totalSubmissions,
      formStats,
    ] = await Promise.all([
      prisma.donationForm.count(),
      prisma.donationForm.count({ where: { status: "PUBLISHED" } }),
      prisma.donationSubmission.count(),
      prisma.donationForm.aggregate({
        _sum: {
          totalCollected: true,
          donationCount: true,
        },
        _avg: {
          averageDonation: true,
        },
      }),
    ]);

    // Top 5 formulaires par montant collecté
    const topForms = await prisma.donationForm.findMany({
      take: 5,
      orderBy: { totalCollected: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        formType: true,
        totalCollected: true,
        donationCount: true,
        goalAmount: true,
      },
    });

    // Soumissions par type de formulaire
    const submissionsByType = await prisma.donationForm.groupBy({
      by: ["formType"],
      _sum: {
        totalCollected: true,
        donationCount: true,
      },
    });

    // Soumissions des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubmissions = await prisma.donationSubmission.groupBy({
      by: ["paymentStatus"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      _sum: {
        amount: true,
      },
    });

    // Évolution quotidienne des 30 derniers jours
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count,
        SUM(amount) as total
      FROM "DonationSubmission"
      WHERE "createdAt" >= ${thirtyDaysAgo}
        AND "paymentStatus" = 'COMPLETED'
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    ` as Array<{ date: Date; count: bigint; total: number }>;

    return NextResponse.json({
      overview: {
        totalForms,
        publishedForms,
        draftForms: totalForms - publishedForms,
        totalSubmissions,
        totalCollected: formStats._sum.totalCollected || 0,
        totalDonations: formStats._sum.donationCount || 0,
        averageDonation: formStats._avg.averageDonation || 0,
      },
      topForms,
      submissionsByType: submissionsByType.map(item => ({
        formType: item.formType,
        totalCollected: item._sum.totalCollected || 0,
        donationCount: item._sum.donationCount || 0,
      })),
      recentActivity: {
        period: "30 jours",
        byStatus: recentSubmissions.map(item => ({
          status: item.paymentStatus,
          count: item._count,
          total: item._sum.amount || 0,
        })),
      },
      dailyStats: dailyStats.map(item => ({
        date: item.date,
        count: Number(item.count),
        total: item.total || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching form stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}

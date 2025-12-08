import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (startDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(endDate) };
    }

    // Get donor statistics
    const [
      totalDonors,
      activeDonors,
      newDonorsThisMonth,
      donorStats,
    ] = await Promise.all([
      prisma.donor.count(),
      prisma.donor.count({ where: { status: "ACTIVE" } }),
      prisma.donor.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.donor.aggregate({
        _sum: { totalDonations: true },
        _avg: { totalDonations: true, averageDonation: true },
        _max: { highestDonation: true },
      }),
    ]);

    // Get donation form statistics
    const [
      totalForms,
      publishedForms,
      formStats,
    ] = await Promise.all([
      prisma.donationForm.count(),
      prisma.donationForm.count({ where: { status: "PUBLISHED" } }),
      prisma.donationForm.aggregate({
        _sum: { totalCollected: true, donationCount: true },
        _avg: { averageDonation: true },
      }),
    ]);

    // Get submission statistics
    const [
      totalSubmissions,
      completedSubmissions,
      pendingSubmissions,
      submissionStats,
    ] = await Promise.all([
      prisma.donationSubmission.count({ where: dateFilter }),
      prisma.donationSubmission.count({ 
        where: { ...dateFilter, paymentStatus: "COMPLETED" } 
      }),
      prisma.donationSubmission.count({ 
        where: { ...dateFilter, paymentStatus: "PENDING" } 
      }),
      prisma.donationSubmission.aggregate({
        where: { ...dateFilter, paymentStatus: "COMPLETED" },
        _sum: { amount: true },
        _avg: { amount: true },
        _max: { amount: true },
        _count: true,
      }),
    ]);

    // Get recurring donations
    const recurringDonations = await prisma.donationSubmission.count({
      where: { ...dateFilter, isRecurring: true, paymentStatus: "COMPLETED" },
    });

    // Calculate conversion rate (completed / total)
    const conversionRate = totalSubmissions > 0 
      ? (completedSubmissions / totalSubmissions) * 100 
      : 0;

    // Get top segments
    const segmentDistribution = await prisma.donor.groupBy({
      by: ["segment"],
      _count: true,
      _sum: { totalDonations: true },
      orderBy: { _sum: { totalDonations: "desc" } },
      take: 5,
    });

    // Get donor type distribution
    const donorTypeDistribution = await prisma.donor.groupBy({
      by: ["donorType"],
      _count: true,
      _sum: { totalDonations: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        donors: {
          total: totalDonors,
          active: activeDonors,
          newThisMonth: newDonorsThisMonth,
          totalDonations: donorStats._sum.totalDonations || 0,
          averageDonation: donorStats._avg.averageDonation || 0,
          averageLifetimeValue: donorStats._avg.totalDonations || 0,
          highestDonation: donorStats._max.highestDonation || 0,
        },
        forms: {
          total: totalForms,
          published: publishedForms,
          totalCollected: formStats._sum.totalCollected || 0,
          totalDonations: formStats._sum.donationCount || 0,
          averageDonation: formStats._avg.averageDonation || 0,
        },
        submissions: {
          total: totalSubmissions,
          completed: completedSubmissions,
          pending: pendingSubmissions,
          recurring: recurringDonations,
          totalAmount: submissionStats._sum.amount || 0,
          averageAmount: submissionStats._avg.amount || 0,
          maxAmount: submissionStats._max.amount || 0,
          conversionRate: Math.round(conversionRate * 100) / 100,
        },
        segments: segmentDistribution.map(s => ({
          name: s.segment || "Non défini",
          count: s._count,
          totalDonations: s._sum.totalDonations || 0,
        })),
        donorTypes: donorTypeDistribution.map(d => ({
          type: d.donorType,
          count: d._count,
          totalDonations: d._sum.totalDonations || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") || "all"; // donors, forms, campaigns

    // Top donors by total donations
    const topDonors = await prisma.donor.findMany({
      where: { status: "ACTIVE" },
      orderBy: { totalDonations: "desc" },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalDonations: true,
        donationCount: true,
        averageDonation: true,
        donorType: true,
        segment: true,
        city: true,
      },
    });

    // Top performing forms
    const topForms = await prisma.donationForm.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { totalCollected: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        formType: true,
        totalCollected: true,
        donationCount: true,
        averageDonation: true,
        goalAmount: true,
      },
    });

    // Recent large donations
    const recentLargeDonations = await prisma.donationSubmission.findMany({
      where: { paymentStatus: "COMPLETED" },
      orderBy: { amount: "desc" },
      take: limit,
      select: {
        id: true,
        amount: true,
        firstName: true,
        lastName: true,
        isAnonymous: true,
        createdAt: true,
        form: {
          select: {
            name: true,
          },
        },
      },
    });

    // Donors by city
    const donorsByCity = await prisma.donor.groupBy({
      by: ["city"],
      where: { city: { not: null } },
      _count: true,
      _sum: { totalDonations: true },
      orderBy: { _sum: { totalDonations: "desc" } },
      take: limit,
    });

    // Donors by acquisition source
    const donorsBySource = await prisma.donor.groupBy({
      by: ["source"],
      where: { source: { not: null } },
      _count: true,
      _sum: { totalDonations: true },
      orderBy: { _sum: { totalDonations: "desc" } },
    });

    // Form type performance
    const formTypePerformance = await prisma.donationForm.groupBy({
      by: ["formType"],
      _count: true,
      _sum: { totalCollected: true, donationCount: true },
      _avg: { averageDonation: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        topDonors: topDonors.map((d) => ({
          id: d.id,
          name: `${d.firstName} ${d.lastName}`,
          email: d.email,
          totalDonations: d.totalDonations,
          donationCount: d.donationCount,
          averageDonation: d.averageDonation,
          type: d.donorType,
          segment: d.segment,
          city: d.city,
        })),
        topForms: topForms.map((f) => ({
          id: f.id,
          name: f.name,
          slug: f.slug,
          type: f.formType,
          totalCollected: f.totalCollected,
          donationCount: f.donationCount,
          averageDonation: f.averageDonation,
          goalAmount: f.goalAmount,
          progress: f.goalAmount ? (f.totalCollected / f.goalAmount) * 100 : null,
        })),
        recentLargeDonations: recentLargeDonations.map((d) => ({
          id: d.id,
          amount: d.amount,
          donor: d.isAnonymous ? "Anonyme" : `${d.firstName} ${d.lastName}`,
          formName: d.form?.name || "N/A",
          date: d.createdAt,
        })),
        byCity: donorsByCity.map((c) => ({
          city: c.city || "Non spécifié",
          count: c._count,
          totalDonations: c._sum.totalDonations || 0,
        })),
        bySource: donorsBySource.map((s) => ({
          source: s.source || "Non spécifié",
          count: s._count,
          totalDonations: s._sum.totalDonations || 0,
        })),
        formTypePerformance: formTypePerformance.map((f) => ({
          type: f.formType,
          count: f._count,
          totalCollected: f._sum.totalCollected || 0,
          donationCount: f._sum.donationCount || 0,
          averageDonation: f._avg.averageDonation || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching top analytics:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}

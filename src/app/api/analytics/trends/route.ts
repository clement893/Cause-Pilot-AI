import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // day, week, month, year
    const months = parseInt(searchParams.get("months") || "12");

    // Calculate start date based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "day":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      case "week":
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        break;
      case "year":
        startDate = new Date(now.getFullYear() - 5, 0, 1); // Last 5 years
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
        break;
    }

    // Get donations over time
    const donations = await prisma.donationSubmission.findMany({
      where: {
        createdAt: { gte: startDate },
        paymentStatus: "COMPLETED",
      },
      select: {
        amount: true,
        createdAt: true,
        isRecurring: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Get new donors over time
    const newDonors = await prisma.donor.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        donorType: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group data by period
    const groupByPeriod = (date: Date): string => {
      switch (period) {
        case "day":
          return date.toISOString().split("T")[0];
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          return weekStart.toISOString().split("T")[0];
        case "year":
          return date.getFullYear().toString();
        case "month":
        default:
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
    };

    // Aggregate donations by period
    const donationsByPeriod: Record<string, { 
      amount: number; 
      count: number; 
      recurring: number;
      oneTime: number;
    }> = {};

    donations.forEach((d) => {
      const key = groupByPeriod(new Date(d.createdAt));
      if (!donationsByPeriod[key]) {
        donationsByPeriod[key] = { amount: 0, count: 0, recurring: 0, oneTime: 0 };
      }
      donationsByPeriod[key].amount += d.amount;
      donationsByPeriod[key].count += 1;
      if (d.isRecurring) {
        donationsByPeriod[key].recurring += d.amount;
      } else {
        donationsByPeriod[key].oneTime += d.amount;
      }
    });

    // Aggregate new donors by period
    const donorsByPeriod: Record<string, { 
      count: number; 
      individual: number;
      corporate: number;
    }> = {};

    newDonors.forEach((d) => {
      const key = groupByPeriod(new Date(d.createdAt));
      if (!donorsByPeriod[key]) {
        donorsByPeriod[key] = { count: 0, individual: 0, corporate: 0 };
      }
      donorsByPeriod[key].count += 1;
      if (d.donorType === "CORPORATE") {
        donorsByPeriod[key].corporate += 1;
      } else {
        donorsByPeriod[key].individual += 1;
      }
    });

    // Generate all periods in range
    const allPeriods: string[] = [];
    const current = new Date(startDate);
    while (current <= now) {
      allPeriods.push(groupByPeriod(current));
      switch (period) {
        case "day":
          current.setDate(current.getDate() + 1);
          break;
        case "week":
          current.setDate(current.getDate() + 7);
          break;
        case "year":
          current.setFullYear(current.getFullYear() + 1);
          break;
        case "month":
        default:
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    // Build response with all periods
    const donationTrends = [...new Set(allPeriods)].map((p) => ({
      period: p,
      amount: donationsByPeriod[p]?.amount || 0,
      count: donationsByPeriod[p]?.count || 0,
      recurring: donationsByPeriod[p]?.recurring || 0,
      oneTime: donationsByPeriod[p]?.oneTime || 0,
    }));

    const donorTrends = [...new Set(allPeriods)].map((p) => ({
      period: p,
      count: donorsByPeriod[p]?.count || 0,
      individual: donorsByPeriod[p]?.individual || 0,
      corporate: donorsByPeriod[p]?.corporate || 0,
    }));

    // Calculate growth rates
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 100) / 100;
    };

    const lastPeriodDonations = donationTrends[donationTrends.length - 1]?.amount || 0;
    const previousPeriodDonations = donationTrends[donationTrends.length - 2]?.amount || 0;
    const donationGrowth = calculateGrowth(lastPeriodDonations, previousPeriodDonations);

    const lastPeriodDonors = donorTrends[donorTrends.length - 1]?.count || 0;
    const previousPeriodDonors = donorTrends[donorTrends.length - 2]?.count || 0;
    const donorGrowth = calculateGrowth(lastPeriodDonors, previousPeriodDonors);

    return NextResponse.json({
      success: true,
      data: {
        period,
        donations: donationTrends,
        donors: donorTrends,
        growth: {
          donations: donationGrowth,
          donors: donorGrowth,
        },
        totals: {
          donations: donations.reduce((sum, d) => sum + d.amount, 0),
          donationCount: donations.length,
          newDonors: newDonors.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching analytics trends:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des tendances" },
      { status: 500 }
    );
  }
}

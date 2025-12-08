import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Classement P2P
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const type = searchParams.get("type") || "fundraisers"; // fundraisers | teams
    const sortBy = searchParams.get("sortBy") || "totalRaised"; // totalRaised | donorCount | points
    const limit = parseInt(searchParams.get("limit") || "10");

    if (type === "teams") {
      const where: Record<string, unknown> = { status: "ACTIVE" };
      if (campaignId) where.campaignId = campaignId;

      const teams = await prisma.p2PTeam.findMany({
        where,
        orderBy: { [sortBy]: "desc" },
        take: limit,
        include: {
          members: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
            take: 3,
          },
          _count: {
            select: { members: true },
          },
        },
      });

      const rankedTeams = teams.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));

      return NextResponse.json({
        type: "teams",
        leaderboard: rankedTeams,
      });
    }

    // Classement des fundraisers
    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (campaignId) where.campaignId = campaignId;

    const fundraisers = await prisma.p2PFundraiser.findMany({
      where,
      orderBy: { [sortBy]: "desc" },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        slug: true,
        totalRaised: true,
        donorCount: true,
        points: true,
        level: true,
        badges: true,
        goalAmount: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const rankedFundraisers = fundraisers.map((f, index) => ({
      rank: index + 1,
      ...f,
      progressPercent: f.goalAmount > 0 ? Math.min((f.totalRaised / f.goalAmount) * 100, 100) : 0,
    }));

    return NextResponse.json({
      type: "fundraisers",
      leaderboard: rankedFundraisers,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du classement" },
      { status: 500 }
    );
  }
}

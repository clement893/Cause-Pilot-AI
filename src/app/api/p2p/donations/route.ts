import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des donations P2P
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fundraiserId = searchParams.get("fundraiserId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const where: Record<string, unknown> = {};

    if (fundraiserId) where.fundraiserId = fundraiserId;
    if (status) where.status = status;

    const [donations, total] = await Promise.all([
      prisma.p2PDonation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          fundraiser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              slug: true,
            },
          },
        },
      }),
      prisma.p2PDonation.count({ where }),
    ]);

    return NextResponse.json({
      donations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des donations" },
      { status: 500 }
    );
  }
}

// POST - Créer une donation P2P
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Vérifier que le fundraiser existe et est actif
    const fundraiser = await prisma.p2PFundraiser.findUnique({
      where: { id: body.fundraiserId },
      include: {
        Campaign: true,
        P2PTeam: true,
      },
    });

    if (!fundraiser) {
      return NextResponse.json(
        { error: "Fundraiser non trouvé" },
        { status: 404 }
      );
    }

    if (fundraiser.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Cette page de collecte n'est pas active" },
        { status: 400 }
      );
    }

    // Créer la donation
    const donation = await prisma.p2PDonation.create({
      data: {
        fundraiserId: body.fundraiserId,
        amount: body.amount,
        currency: body.currency || "CAD",
        donorName: body.isAnonymous ? null : body.donorName,
        donorEmail: body.donorEmail,
        isAnonymous: body.isAnonymous || false,
        message: body.message,
        donorId: body.donorId,
        status: "PENDING",
      },
    });

    // Simuler le traitement du paiement (dans une vraie app, intégrer Stripe)
    // Pour la démo, on marque directement comme complété
    const completedDonation = await prisma.p2PDonation.update({
      where: { id: donation.id },
      data: {
        status: "COMPLETED",
        transactionId: `P2P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    });

    // Mettre à jour les statistiques du fundraiser
    const fundraiserStats = await prisma.p2PDonation.aggregate({
      where: { fundraiserId: body.fundraiserId, status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
    });

    await prisma.p2PFundraiser.update({
      where: { id: body.fundraiserId },
      data: {
        totalRaised: fundraiserStats._sum.amount || 0,
        donationCount: fundraiserStats._count,
        donorCount: { increment: 1 },
        averageDonation: fundraiserStats._avg.amount || 0,
        points: { increment: Math.floor(body.amount / 10) }, // 1 point par 10$
      },
    });

    // Mettre à jour les stats de l'équipe si applicable
    if (fundraiser.teamId) {
      const teamStats = await prisma.p2PDonation.aggregate({
        where: {
          fundraiser: { teamId: fundraiser.teamId },
          status: "COMPLETED",
        },
        _sum: { amount: true },
        _count: true,
      });

      await prisma.p2PTeam.update({
        where: { id: fundraiser.teamId },
        data: {
          totalRaised: teamStats._sum.amount || 0,
          donationCount: teamStats._count,
        },
      });
    }

    // Créer l'activité de don reçu
    await prisma.p2PActivity.create({
      data: {
        fundraiserId: body.fundraiserId,
        activityType: "DONATION_RECEIVED",
        title: "Nouveau don reçu",
        description: body.isAnonymous
          ? `Un donateur anonyme a donné ${body.amount}$`
          : `${body.donorName} a donné ${body.amount}$`,
        metadata: {
          amount: body.amount,
          donorName: body.isAnonymous ? "Anonyme" : body.donorName,
        },
      },
    });

    // Vérifier si l'objectif est atteint
    const updatedFundraiser = await prisma.p2PFundraiser.findUnique({
      where: { id: body.fundraiserId },
    });

    if (updatedFundraiser && updatedFundraiser.totalRaised >= updatedFundraiser.goalAmount) {
      await prisma.p2PActivity.create({
        data: {
          fundraiserId: body.fundraiserId,
          activityType: "GOAL_REACHED",
          title: "Objectif atteint !",
          description: `${fundraiser.firstName} a atteint son objectif de ${fundraiser.goalAmount}$ !`,
        },
      });
    }

    // Vérifier les jalons (25%, 50%, 75%)
    const progressPercent = (updatedFundraiser!.totalRaised / updatedFundraiser!.goalAmount) * 100;
    const milestones = [25, 50, 75];
    for (const milestone of milestones) {
      const previousProgress = ((updatedFundraiser!.totalRaised - body.amount) / updatedFundraiser!.goalAmount) * 100;
      if (previousProgress < milestone && progressPercent >= milestone) {
        await prisma.p2PActivity.create({
          data: {
            fundraiserId: body.fundraiserId,
            activityType: "MILESTONE_REACHED",
            title: `${milestone}% de l'objectif atteint`,
            description: `${fundraiser.firstName} a atteint ${milestone}% de son objectif !`,
            metadata: { milestone },
          },
        });
      }
    }

    return NextResponse.json(completedDonation, { status: 201 });
  } catch (error) {
    console.error("Error creating donation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la donation" },
      { status: 500 }
    );
  }
}

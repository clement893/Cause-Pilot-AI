import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Détail d'une campagne
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        CampaignMilestone: {
          orderBy: { sortOrder: "asc" },
        },
        CampaignDonor: {
          orderBy: { totalDonated: "desc" },
          take: 50,
        },
        CampaignForm: true,
        CampaignUpdate: {
          where: { isPublished: true },
          orderBy: { publishedAt: "desc" },
          take: 5,
        },
        CampaignTeamMember: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            CampaignDonor: true,
            CampaignForm: true,
            CampaignUpdate: true,
            CampaignTeamMember: true,
          },
        },
      },
    });

    // Récupérer les formulaires liés avec leurs détails
    const linkedForms = await prisma.donationForm.findMany({
      where: {
        id: {
          in: campaign?.CampaignForm.map(f => f.formId) || []
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        formType: true,
        status: true,
        totalCollected: true,
        donationCount: true,
      }
    });

    // Récupérer les campagnes emails liées (par nom de campagne)
    const linkedEmailCampaigns = await prisma.emailCampaign.findMany({
      where: {
        OR: [
          { name: { contains: campaign?.name || '' } },
          { tags: { has: campaign?.slug || '' } },
        ]
      },
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        sentAt: true,
        totalRecipients: true,
        openCount: true,
        clickCount: true,
        openRate: true,
        clickRate: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Récupérer les donateurs avec leurs informations complètes
    const donorIds = campaign?.CampaignDonor.map(d => d.donorId) || [];
    const donorsDetails = await prisma.donor.findMany({
      where: {
        id: { in: donorIds }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        totalDonations: true,
        donationCount: true,
        status: true,
        segment: true,
      }
    });

    // Combiner les données des donateurs
    const donorsWithDetails = campaign?.CampaignDonor.map(cd => {
      const donor = donorsDetails.find(d => d.id === cd.donorId);
      return {
        ...cd,
        donor,
      };
    }) || [];

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Calculer la progression
    const progress = campaign.goalAmount
      ? Math.min((campaign.totalRaised / campaign.goalAmount) * 100, 100)
      : 0;

    // Calculer les jours restants
    let daysRemaining = null;
    if (campaign.endDate) {
      const now = new Date();
      const end = new Date(campaign.endDate);
      daysRemaining = Math.max(
        0,
        Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    return NextResponse.json({
      ...campaign,
      progress,
      daysRemaining,
      linkedForms,
      linkedEmailCampaigns,
      donorsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une campagne
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier si la campagne existe
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Mettre à jour le slug si le nom change
    let slug = existing.slug;
    if (body.name && body.name !== existing.name) {
      const baseSlug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const found = await prisma.campaign.findUnique({ where: { slug } });
        if (!found || found.id === id) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name: body.name,
        slug,
        description: body.description,
        shortDescription: body.shortDescription,
        campaignType: body.campaignType,
        status: body.status,
        priority: body.priority,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        launchDate: body.launchDate ? new Date(body.launchDate) : null,
        goalAmount: body.goalAmount !== undefined ? parseFloat(body.goalAmount) || null : undefined,
        minimumGoal: body.minimumGoal !== undefined ? parseFloat(body.minimumGoal) || null : undefined,
        stretchGoal: body.stretchGoal !== undefined ? parseFloat(body.stretchGoal) || null : undefined,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
        thumbnailUrl: body.thumbnailUrl,
        thankYouMessage: body.thankYouMessage,
        impactStatement: body.impactStatement,
        isPublic: body.isPublic,
        allowP2P: body.allowP2P,
        enableMatching: body.enableMatching,
        matchingRatio: body.matchingRatio !== undefined ? parseFloat(body.matchingRatio) || null : undefined,
        matchingCap: body.matchingCap !== undefined ? parseFloat(body.matchingCap) || null : undefined,
        category: body.category,
        tags: body.tags,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        ogImage: body.ogImage,
      },
      include: {
        CampaignMilestone: true,
        _count: {
          select: {
            CampaignDonor: true,
            CampaignForm: true,
          },
        },
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une campagne
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si la campagne existe
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Supprimer la campagne (les relations seront supprimées en cascade)
    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

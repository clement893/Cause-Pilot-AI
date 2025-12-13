import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des campagnes email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.campaignType = type;
    }

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          EmailTemplate: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          _count: {
            select: { EmailRecipient: true },
          },
        },
      }),
      prisma.emailCampaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des campagnes" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle campagne email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Si un template est sélectionné, récupérer ses données
    let templateData = null;
    if (body.templateId) {
      templateData = await prisma.emailTemplate.findUnique({
        where: { id: body.templateId },
      });
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        name: body.name,
        description: body.description,
        campaignType: body.campaignType || "ONE_TIME",
        status: "DRAFT",
        subject: body.subject || templateData?.subject,
        preheader: body.preheader || templateData?.preheader,
        htmlContent: body.htmlContent || templateData?.htmlContent,
        segmentRules: body.segmentRules,
        tags: body.tags || [],
        segments: body.segments || [],
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        fromName: body.fromName || "Nucleus Cause",
        fromEmail: body.fromEmail || "noreply@nucleuscause.com",
        replyTo: body.replyTo,
        isABTest: body.isABTest || false,
        variantA: body.variantA,
        variantB: body.variantB,
        templateId: body.templateId,
      },
      include: {
        EmailTemplate: true,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la campagne" },
      { status: 500 }
    );
  }
}

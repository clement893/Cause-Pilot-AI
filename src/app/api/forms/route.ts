import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Liste tous les formulaires de don
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const formType = searchParams.get("formType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    if (formType) {
      where.formType = formType;
    }

    const [forms, total] = await Promise.all([
      prisma.donationForm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { DonationSubmission: true },
          },
        },
      }),
      prisma.donationForm.count({ where }),
    ]);

    return NextResponse.json({
      data: forms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des formulaires" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau formulaire de don
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Générer un slug unique si non fourni
    let slug = body.slug || body.name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    // Vérifier si le slug existe déjà
    const existingForm = await prisma.donationForm.findUnique({
      where: { slug },
    });
    
    if (existingForm) {
      slug = `${slug}-${Date.now()}`;
    }

    const form = await prisma.donationForm.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        formType: body.formType || "ONE_TIME",
        status: body.status || "DRAFT",
        suggestedAmounts: body.suggestedAmounts || [25, 50, 100, 250, 500],
        minimumAmount: body.minimumAmount || 5,
        maximumAmount: body.maximumAmount,
        allowCustomAmount: body.allowCustomAmount ?? true,
        defaultAmount: body.defaultAmount,
        recurringOptions: body.recurringOptions || ["MONTHLY"],
        defaultRecurring: body.defaultRecurring,
        primaryColor: body.primaryColor || "#6366f1",
        secondaryColor: body.secondaryColor || "#8b5cf6",
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
        thankYouMessage: body.thankYouMessage || "Merci pour votre généreux don!",
        thankYouRedirectUrl: body.thankYouRedirectUrl,
        collectPhone: body.collectPhone ?? false,
        collectAddress: body.collectAddress ?? false,
        collectEmployer: body.collectEmployer ?? false,
        collectComment: body.collectComment ?? true,
        collectDedication: body.collectDedication ?? false,
        allowAnonymous: body.allowAnonymous ?? true,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        campaignId: body.campaignId,
        campaignName: body.campaignName,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        goalAmount: body.goalAmount,
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du formulaire" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des templates email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des templates" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const template = await prisma.emailTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category || "GENERAL",
        subject: body.subject,
        preheader: body.preheader,
        htmlContent: body.htmlContent,
        textContent: body.textContent,
        variables: body.variables || [],
        primaryColor: body.primaryColor || "#6366f1",
        logoUrl: body.logoUrl,
        footerText: body.footerText,
        isActive: body.isActive ?? true,
        isDefault: body.isDefault ?? false,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du template" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STARTER_TEMPLATES } from "@/lib/email-editor/utils";
import { blocksToHtml } from "@/lib/email-editor/utils";

// GET - Liste des templates email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const includeStarters = searchParams.get("includeStarters") === "true";

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    // Inclure les templates de démarrage si demandé
    if (includeStarters) {
      const starterTemplates = STARTER_TEMPLATES.map((t, index) => ({
        id: `starter-${index}`,
        name: t.name,
        description: t.description,
        category: t.category?.toUpperCase() || "GENERAL",
        blocks: t.blocks,
        globalStyle: t.globalStyle,
        htmlContent: null,
        textContent: null,
        subject: null,
        preheader: null,
        variables: [],
        primaryColor: "#6366f1",
        logoUrl: null,
        footerText: null,
        thumbnail: null,
        isActive: true,
        isDefault: true,
        isStarter: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { campaigns: 0 },
      }));
      
      return NextResponse.json([...starterTemplates, ...templates]);
    }

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

    // Si on a des blocs, générer le HTML
    let htmlContent = body.htmlContent;
    if (body.blocks && !htmlContent) {
      htmlContent = blocksToHtml(body.blocks, body.globalStyle);
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category || "GENERAL",
        subject: body.subject,
        preheader: body.preheader,
        htmlContent,
        textContent: body.textContent,
        blocks: body.blocks,
        globalStyle: body.globalStyle,
        thumbnail: body.thumbnail,
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

import { NextRequest, NextResponse } from "next/server";
import { getMainPrisma } from "@/lib/prisma-org";
import { z } from "zod";

const updateDatabaseUrlSchema = z.object({
  databaseUrl: z.string().url().nullable().optional(),
});

/**
 * GET /api/organizations/[id]/database
 * Récupère l'URL de la base de données pour une organisation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const mainPrisma = getMainPrisma();

    const organization = await mainPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, databaseUrl: true },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId: organization.id,
        organizationName: organization.name,
        databaseUrl: organization.databaseUrl,
        hasDedicatedDatabase: !!organization.databaseUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching organization database:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch organization database info" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]/database
 * Met à jour l'URL de la base de données pour une organisation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const body = await request.json();
    const validatedData = updateDatabaseUrlSchema.parse(body);

    const mainPrisma = getMainPrisma();

    // Vérifier que l'organisation existe
    const organization = await mainPrisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Mettre à jour l'URL de la base de données
    const updated = await mainPrisma.organization.update({
      where: { id: organizationId },
      data: {
        databaseUrl: validatedData.databaseUrl || null,
      },
      select: { id: true, name: true, databaseUrl: true },
    });

    return NextResponse.json({
      success: true,
      message: validatedData.databaseUrl
        ? "Dedicated database configured successfully"
        : "Organization switched to shared database",
      data: {
        organizationId: updated.id,
        organizationName: updated.name,
        databaseUrl: updated.databaseUrl,
        hasDedicatedDatabase: !!updated.databaseUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Error updating organization database:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update organization database" },
      { status: 500 }
    );
  }
}

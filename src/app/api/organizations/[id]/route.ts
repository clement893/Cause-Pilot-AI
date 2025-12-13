import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer une organisation par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        OrganizationMember: {
          include: {
            // On ne peut pas inclure User directement car la relation n'est pas définie
            // On récupère juste les membres
          },
        },
        _count: {
          select: { 
            OrganizationMember: true,
            DashboardLayout: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'organisation" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une organisation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        legalName: body.legalName,
        charityNumber: body.charityNumber,
        taxId: body.taxId,
        address: body.address,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        phone: body.phone,
        email: body.email,
        website: body.website,
        timezone: body.timezone,
        currency: body.currency,
        language: body.language,
        status: body.status,
        plan: body.plan,
        maxUsers: body.maxUsers,
        maxDonors: body.maxDonors,
        maxCampaigns: body.maxCampaigns,
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'organisation" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une organisation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'organisation" },
      { status: 500 }
    );
  }
}

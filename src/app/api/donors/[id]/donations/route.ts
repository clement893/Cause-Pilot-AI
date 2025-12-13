import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma-org";
import { getOrganizationId } from "@/lib/organization";

// GET - Récupérer les dons d'un donateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationId(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    const prisma = await getPrisma(request);

    const donations = await prisma.donation.findMany({
      where: { 
        donorId: id,
        donor: { organizationId }, // S'assurer que le donateur appartient à l'organisation
      },
      orderBy: { donationDate: "desc" },
    });

    // Transformer les données pour inclure le nom de la campagne
    const donationsWithCampaign = donations.map((donation) => ({
      ...donation,
      campaign: donation.campaignName
        ? { id: donation.campaignId, name: donation.campaignName }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: donationsWithCampaign,
    });
  } catch (error) {
    console.error("Error fetching donor donations:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des dons" },
      { status: 500 }
    );
  }
}

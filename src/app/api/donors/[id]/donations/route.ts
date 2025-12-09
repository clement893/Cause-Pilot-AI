import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les dons d'un donateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const donations = await prisma.donation.findMany({
      where: { donorId: id },
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

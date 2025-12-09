import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Activer le P2P sur une campagne
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Vérifier si la campagne existe
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Activer le P2P
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { allowP2P: true },
    });

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
    });
  } catch (error) {
    console.error("Error enabling P2P:", error);
    return NextResponse.json(
      { error: "Failed to enable P2P" },
      { status: 500 }
    );
  }
}

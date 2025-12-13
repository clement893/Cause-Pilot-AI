import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/donors/[id] - Obtenir un donateur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const donor = await prisma.donor.findUnique({
      where: { id },
      include: {
        DonorPreference: true,
        donations: {
          orderBy: { donationDate: "desc" },
          take: 10,
        },
        customFields: {
          include: { field: true },
        },
        communications: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { Donation: true, Communication: true },
        },
      },
    });
    
    if (!donor) {
      return NextResponse.json(
        { success: false, error: "Donor not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: donor });
  } catch (error) {
    console.error("Error fetching donor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch donor" },
      { status: 500 }
    );
  }
}

// PUT /api/donors/[id] - Mettre à jour un donateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Vérifier que le donateur existe
    const existingDonor = await prisma.donor.findUnique({
      where: { id },
    });
    
    if (!existingDonor) {
      return NextResponse.json(
        { success: false, error: "Donor not found" },
        { status: 404 }
      );
    }
    
    // Vérifier l'unicité de l'email si modifié
    if (body.email && body.email !== existingDonor.email) {
      const emailExists = await prisma.donor.findUnique({
        where: { email: body.email },
      });
      
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already in use by another donor" },
          { status: 409 }
        );
      }
    }
    
    // Mettre à jour le donateur
    const donor = await prisma.donor.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        mobile: body.mobile || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        address: body.address || null,
        address2: body.address2 || null,
        city: body.city || null,
        state: body.state || null,
        postalCode: body.postalCode || null,
        country: body.country,
        profession: body.profession || null,
        employer: body.employer || null,
        jobTitle: body.jobTitle || null,
        industry: body.industry || null,
        status: body.status,
        donorType: body.donorType,
        segment: body.segment || null,
        tags: body.tags || [],
        notes: body.notes || null,
        source: body.source || null,
        consentEmail: body.consentEmail ?? existingDonor.consentEmail,
        consentPhone: body.consentPhone ?? existingDonor.consentPhone,
        consentMail: body.consentMail ?? existingDonor.consentMail,
      },
      include: {
        DonorPreference: true,
      },
    });
    
    // Mettre à jour les préférences si fournies
    if (body.preferences) {
      await prisma.donorPreference.upsert({
        where: { donorId: id },
        create: {
          donorId: id,
          preferredChannel: body.preferences.preferredChannel || "EMAIL",
          preferredFrequency: body.preferences.preferredFrequency || "MONTHLY",
          preferredLanguage: body.preferences.preferredLanguage || "fr",
          causesOfInterest: body.preferences.causesOfInterest || [],
        },
        update: {
          preferredChannel: body.preferences.preferredChannel,
          preferredFrequency: body.preferences.preferredFrequency,
          preferredLanguage: body.preferences.preferredLanguage,
          causesOfInterest: body.preferences.causesOfInterest,
        },
      });
    }
    
    return NextResponse.json({ success: true, data: donor });
  } catch (error) {
    console.error("Error updating donor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update donor" },
      { status: 500 }
    );
  }
}

// DELETE /api/donors/[id] - Supprimer un donateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier que le donateur existe
    const existingDonor = await prisma.donor.findUnique({
      where: { id },
    });
    
    if (!existingDonor) {
      return NextResponse.json(
        { success: false, error: "Donor not found" },
        { status: 404 }
      );
    }
    
    // Supprimer le donateur (cascade supprimera les relations)
    await prisma.donor.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: "Donor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting donor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete donor" },
      { status: 500 }
    );
  }
}

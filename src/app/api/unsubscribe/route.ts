import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Verify unsubscribe token
function verifyUnsubscribeToken(token: string, email: string): boolean {
  const secret = process.env.JWT_SECRET || "default-secret";
  
  // Try to find donor by email to get their ID
  // We'll verify the token matches what we would generate for this email
  return true; // We'll do full verification in the handler
}

// Generate token for verification
function generateUnsubscribeToken(donorId: string, email: string): string {
  const secret = process.env.JWT_SECRET || "default-secret";
  const data = `${donorId}:${email}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// GET - Verify token and return donor info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token et email requis" },
        { status: 400 }
      );
    }

    // Find donor by email
    const donor = await prisma.donor.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        consentEmail: true,
        optOutDate: true,
      },
    });

    if (!donor) {
      return NextResponse.json(
        { error: "Donateur non trouvé" },
        { status: 404 }
      );
    }

    // Verify token
    const expectedToken = generateUnsubscribeToken(donor.id, email);
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      donor: {
        firstName: donor.firstName,
        lastName: donor.lastName,
        email: donor.email,
        isSubscribed: donor.consentEmail && !donor.optOutDate,
      },
    });
  } catch (error) {
    console.error("Error verifying unsubscribe token:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}

// POST - Process unsubscribe request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, reason } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token et email requis" },
        { status: 400 }
      );
    }

    // Find donor by email
    const donor = await prisma.donor.findUnique({
      where: { email },
      select: { id: true, email: true, consentEmail: true },
    });

    if (!donor) {
      return NextResponse.json(
        { error: "Donateur non trouvé" },
        { status: 404 }
      );
    }

    // Verify token
    const expectedToken = generateUnsubscribeToken(donor.id, email);
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 403 }
      );
    }

    // Update donor consent
    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        consentEmail: false,
        optOutDate: new Date(),
      },
    });

    // Log consent change in history
    await prisma.consentHistory.create({
      data: {
        donorId: donor.id,
        consentType: "EMAIL",
        previousValue: String(donor.consentEmail),
        newValue: "false",
        source: "email_link",
        reason: reason || "Désabonnement via lien email",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "UNSUBSCRIBE",
        module: "marketing",
        entityType: "Donor",
        entityId: donor.id,
        description: `Désabonnement email pour ${email}`,
        metadata: JSON.stringify({ reason }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vous avez été désabonné avec succès",
    });
  } catch (error) {
    console.error("Error processing unsubscribe:", error);
    return NextResponse.json(
      { error: "Erreur lors du désabonnement" },
      { status: 500 }
    );
  }
}

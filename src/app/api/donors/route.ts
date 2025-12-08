import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/donors - Liste des donateurs avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Tri
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Filtres
    const status = searchParams.get("status");
    const segment = searchParams.get("segment");
    const donorType = searchParams.get("donorType");
    const search = searchParams.get("search");
    
    // Construction de la requête
    const where: Prisma.DonorWhereInput = {};
    
    if (status) {
      where.status = status as Prisma.EnumDonorStatusFilter["equals"];
    }
    
    if (segment) {
      where.segment = segment;
    }
    
    if (donorType) {
      where.donorType = donorType as Prisma.EnumDonorTypeFilter["equals"];
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Exécution des requêtes
    const [donors, total] = await Promise.all([
      prisma.donor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          preferences: true,
          _count: {
            select: { donations: true },
          },
        },
      }),
      prisma.donor.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: donors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching donors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch donors" },
      { status: 500 }
    );
  }
}

// POST /api/donors - Créer un nouveau donateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des champs requis
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { success: false, error: "First name and last name are required" },
        { status: 400 }
      );
    }
    
    // Vérifier si l'email existe déjà
    if (body.email) {
      const existingDonor = await prisma.donor.findUnique({
        where: { email: body.email },
      });
      
      if (existingDonor) {
        return NextResponse.json(
          { success: false, error: "A donor with this email already exists", existingId: existingDonor.id },
          { status: 409 }
        );
      }
    }
    
    // Créer le donateur
    const donor = await prisma.donor.create({
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
        country: body.country || "Canada",
        profession: body.profession || null,
        employer: body.employer || null,
        jobTitle: body.jobTitle || null,
        industry: body.industry || null,
        status: body.status || "ACTIVE",
        donorType: body.donorType || "INDIVIDUAL",
        segment: body.segment || null,
        tags: body.tags || [],
        notes: body.notes || null,
        source: body.source || null,
        consentEmail: body.consentEmail || false,
        consentPhone: body.consentPhone || false,
        consentMail: body.consentMail || false,
        consentDate: body.consentEmail || body.consentPhone || body.consentMail ? new Date() : null,
      },
      include: {
        preferences: true,
      },
    });
    
    // Créer les préférences si fournies
    if (body.preferences) {
      await prisma.donorPreference.create({
        data: {
          donorId: donor.id,
          preferredChannel: body.preferences.preferredChannel || "EMAIL",
          preferredFrequency: body.preferences.preferredFrequency || "MONTHLY",
          preferredLanguage: body.preferences.preferredLanguage || "fr",
          causesOfInterest: body.preferences.causesOfInterest || [],
        },
      });
    }
    
    return NextResponse.json(
      { success: true, data: donor },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating donor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create donor" },
      { status: 500 }
    );
  }
}

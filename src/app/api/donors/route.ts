import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { listQuerySchema, createDonorSchema, parseQueryParams, parseBody } from "@/lib/validation";
import { getOrganizationId } from "@/lib/organization";
import { getPrisma, getMainPrisma } from "@/lib/prisma-org";
import { hasDedicatedDatabase } from "@/lib/prisma-multi";

// GET /api/donors - Liste des donateurs avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Récupérer l'organisation depuis les headers ou query params
    const organizationId = getOrganizationId(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    // Obtenir l'instance Prisma appropriée pour cette organisation
    const prisma = await getPrisma(request);
    
    // Vérifier si l'organisation utilise une base de données dédiée
    const usesDedicatedDB = await hasDedicatedDatabase(organizationId);
    
    // Validation avec Zod
    const query = parseQueryParams(searchParams, listQuerySchema);
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", search, status, segment, donorType } = query;
    const skip = (page - 1) * limit;
    
    // Construction de la requête
    // Si l'organisation utilise une base dédiée, ne pas filtrer par organizationId
    // car tous les donateurs dans cette base appartiennent déjà à cette organisation
    const where: Prisma.DonorWhereInput = usesDedicatedDB ? {} : { organizationId };
    
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
    
    // Debug: logger la requête
    console.log("🔍 Fetching donors with where:", JSON.stringify(where, null, 2));
    console.log("🔍 OrganizationId:", organizationId);
    
    // Exécution des requêtes
    const [donors, total] = await Promise.all([
      prisma.donor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          DonorPreference: true,
          _count: {
            select: { Donation: true },
          },
        },
      }),
      prisma.donor.count({ where }),
    ]);
    
    console.log(`✅ Found ${donors.length} donors (total: ${total})`);
    console.log(`📊 Uses dedicated DB: ${usesDedicatedDB}`);
    if (donors.length > 0) {
      console.log("📋 Sample donor:", { id: donors[0].id, name: `${donors[0].firstName} ${donors[0].lastName}`, orgId: donors[0].organizationId || "N/A (dedicated DB)" });
    }
    
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
    
    // Récupérer l'organisation depuis les headers ou query params
    const organizationId = getOrganizationId(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    // Obtenir l'instance Prisma appropriée pour cette organisation
    const prisma = await getPrisma(request);
    
    // Validation avec Zod
    const validatedData = parseBody(body, createDonorSchema);
    
    // Vérifier si l'organisation utilise une base de données dédiée
    const usesDedicatedDB = await hasDedicatedDatabase(organizationId);
    
    // Vérifier si l'email existe déjà dans cette organisation
    if (validatedData.email) {
      const emailWhere = usesDedicatedDB 
        ? { email: validatedData.email }
        : { email: validatedData.email, organizationId };
      const existingDonor = await prisma.donor.findFirst({
        where: emailWhere,
      });
      
      if (existingDonor) {
        return NextResponse.json(
          { success: false, error: "A donor with this email already exists", existingId: existingDonor.id },
          { status: 409 }
        );
      }
    }
    
    // Créer le donateur
    // Ne pas inclure organizationId si l'organisation utilise une base dédiée
    const donorData: Prisma.DonorUncheckedCreateInput = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      mobile: validatedData.mobile || null,
      dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
      address: validatedData.address || null,
      address2: validatedData.address2 || null,
      city: validatedData.city || null,
      state: validatedData.state || null,
      postalCode: validatedData.postalCode || null,
      country: validatedData.country,
      profession: validatedData.profession || null,
      employer: validatedData.employer || null,
      jobTitle: validatedData.jobTitle || null,
      industry: validatedData.industry || null,
      status: validatedData.status,
      donorType: validatedData.donorType,
      segment: validatedData.segment || null,
      tags: validatedData.tags,
      notes: validatedData.notes || null,
      source: validatedData.source || null,
      consentEmail: validatedData.consentEmail,
      consentPhone: validatedData.consentPhone,
      consentMail: validatedData.consentMail,
      consentDate: validatedData.consentEmail || validatedData.consentPhone || validatedData.consentMail ? new Date() : null,
      ...(usesDedicatedDB ? {} : { organizationId }),
    };
    
    const donor = await prisma.donor.create({
      data: donorData,
      include: {
        DonorPreference: true,
      },
    });
    
    // Créer les préférences si fournies
    if (validatedData.preferences) {
      await prisma.donorPreference.create({
        data: {
          donorId: donor.id,
          preferredChannel: validatedData.preferences.preferredChannel || "EMAIL",
          preferredFrequency: validatedData.preferences.preferredFrequency || "MONTHLY",
          preferredLanguage: validatedData.preferences.preferredLanguage || "fr",
          causesOfInterest: validatedData.preferences.causesOfInterest || [],
        },
      });
    }
    
    return NextResponse.json(
      { success: true, data: donor },
      { status: 201 }
    );
  } catch (error) {
    // Gérer les erreurs de validation Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation error", 
          details: error.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }
    
    console.error("Error creating donor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create donor" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// POST /api/donors/search - Recherche avancée avec filtres multiples
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Pagination
    const page = body.page || 1;
    const limit = body.limit || 20;
    const skip = (page - 1) * limit;
    
    // Construction des conditions de recherche
    const conditions: Prisma.DonorWhereInput[] = [];
    
    // Recherche textuelle
    if (body.query) {
      conditions.push({
        OR: [
          { firstName: { contains: body.query, mode: "insensitive" } },
          { lastName: { contains: body.query, mode: "insensitive" } },
          { email: { contains: body.query, mode: "insensitive" } },
          { phone: { contains: body.query, mode: "insensitive" } },
          { mobile: { contains: body.query, mode: "insensitive" } },
          { employer: { contains: body.query, mode: "insensitive" } },
          { city: { contains: body.query, mode: "insensitive" } },
        ],
      });
    }
    
    // Filtres de statut
    if (body.status && body.status.length > 0) {
      conditions.push({
        status: { in: body.status },
      });
    }
    
    // Filtres de type de donateur
    if (body.donorType && body.donorType.length > 0) {
      conditions.push({
        donorType: { in: body.donorType },
      });
    }
    
    // Filtres de segment
    if (body.segment && body.segment.length > 0) {
      conditions.push({
        segment: { in: body.segment },
      });
    }
    
    // Filtres de localisation
    if (body.city) {
      conditions.push({
        city: { contains: body.city, mode: "insensitive" },
      });
    }
    
    if (body.state) {
      conditions.push({
        state: { contains: body.state, mode: "insensitive" },
      });
    }
    
    if (body.country) {
      conditions.push({
        country: { equals: body.country },
      });
    }
    
    // Filtres de montant de dons
    if (body.minTotalDonations !== undefined) {
      conditions.push({
        totalDonations: { gte: body.minTotalDonations },
      });
    }
    
    if (body.maxTotalDonations !== undefined) {
      conditions.push({
        totalDonations: { lte: body.maxTotalDonations },
      });
    }
    
    // Filtres de nombre de dons
    if (body.minDonationCount !== undefined) {
      conditions.push({
        donationCount: { gte: body.minDonationCount },
      });
    }
    
    // Filtres de date de dernier don
    if (body.lastDonationAfter) {
      conditions.push({
        lastDonationDate: { gte: new Date(body.lastDonationAfter) },
      });
    }
    
    if (body.lastDonationBefore) {
      conditions.push({
        lastDonationDate: { lte: new Date(body.lastDonationBefore) },
      });
    }
    
    // Filtres de date de création
    if (body.createdAfter) {
      conditions.push({
        createdAt: { gte: new Date(body.createdAfter) },
      });
    }
    
    if (body.createdBefore) {
      conditions.push({
        createdAt: { lte: new Date(body.createdBefore) },
      });
    }
    
    // Filtres de consentement
    if (body.hasEmailConsent !== undefined) {
      conditions.push({
        consentEmail: body.hasEmailConsent,
      });
    }
    
    // Filtres de tags
    if (body.tags && body.tags.length > 0) {
      conditions.push({
        tags: { hasSome: body.tags },
      });
    }
    
    // Combiner les conditions
    const where: Prisma.DonorWhereInput = conditions.length > 0
      ? { AND: conditions }
      : {};
    
    // Tri
    const sortBy = body.sortBy || "createdAt";
    const sortOrder = body.sortOrder || "desc";
    
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
      filters: {
        applied: conditions.length,
      },
    });
  } catch (error) {
    console.error("Error searching donors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search donors" },
      { status: 500 }
    );
  }
}

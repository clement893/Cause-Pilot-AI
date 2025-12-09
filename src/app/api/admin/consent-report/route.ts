import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Rapport des consentements pour audit RGPD
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Statistiques globales des consentements
    const totalDonors = await prisma.donor.count();
    
    const consentStats = await prisma.donor.groupBy({
      by: ["consentEmail", "consentPhone", "consentMail"],
      _count: true,
    });

    // Calculer les totaux
    let emailConsent = 0;
    let phoneConsent = 0;
    let mailConsent = 0;
    let noConsent = 0;
    let allConsent = 0;

    consentStats.forEach((stat) => {
      if (stat.consentEmail) emailConsent += stat._count;
      if (stat.consentPhone) phoneConsent += stat._count;
      if (stat.consentMail) mailConsent += stat._count;
      if (!stat.consentEmail && !stat.consentPhone && !stat.consentMail) {
        noConsent += stat._count;
      }
      if (stat.consentEmail && stat.consentPhone && stat.consentMail) {
        allConsent += stat._count;
      }
    });

    // Donateurs avec opt-out récent
    const recentOptOuts = await prisma.donor.count({
      where: {
        optOutDate: {
          not: null,
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
        },
      },
    });

    // Historique des changements de consentement
    const whereClause: Record<string, unknown> = {};
    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      whereClause.createdAt = { 
        ...((whereClause.createdAt as Record<string, unknown>) || {}), 
        lte: new Date(endDate) 
      };
    }

    const consentHistory = await prisma.consentHistory.findMany({
      where: whereClause,
      include: {
        donor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Changements par source
    const changesBySource = await prisma.consentHistory.groupBy({
      by: ["source"],
      _count: true,
      where: whereClause,
    });

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalDonors,
        consentEmail: emailConsent,
        consentPhone: phoneConsent,
        consentMail: mailConsent,
        noConsent,
        allConsent,
        recentOptOuts,
        rates: {
          email: totalDonors > 0 ? ((emailConsent / totalDonors) * 100).toFixed(1) : "0",
          phone: totalDonors > 0 ? ((phoneConsent / totalDonors) * 100).toFixed(1) : "0",
          mail: totalDonors > 0 ? ((mailConsent / totalDonors) * 100).toFixed(1) : "0",
        },
      },
      changesBySource: changesBySource.map((s) => ({
        source: s.source,
        count: s._count,
      })),
      recentChanges: consentHistory.map((h) => ({
        id: h.id,
        donorName: `${h.donor.firstName} ${h.donor.lastName}`,
        donorEmail: h.donor.email,
        consentType: h.consentType,
        previousValue: h.previousValue ? JSON.parse(h.previousValue) : null,
        newValue: JSON.parse(h.newValue),
        source: h.source,
        reason: h.reason,
        createdAt: h.createdAt,
        ipAddress: h.ipAddress,
      })),
    };

    if (format === "csv") {
      // Export CSV pour audit
      const csvRows = [
        ["Date", "Donateur", "Email", "Type", "Source", "Raison", "Avant", "Après", "IP"].join(","),
      ];

      consentHistory.forEach((h) => {
        csvRows.push([
          h.createdAt.toISOString(),
          `"${h.donor.firstName} ${h.donor.lastName}"`,
          h.donor.email || "",
          h.consentType,
          h.source,
          h.reason || "",
          h.previousValue || "",
          h.newValue,
          h.ipAddress || "",
        ].join(","));
      });

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="consent-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating consent report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport" },
      { status: 500 }
    );
  }
}

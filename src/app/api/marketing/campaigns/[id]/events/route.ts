import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les événements d'une campagne email
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get("eventType");
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    // Construire les filtres
    const where: Record<string, unknown> = {
      campaignId: id,
    };

    if (eventType) {
      where.eventType = eventType;
    }

    // Récupérer les événements
    const [events, total] = await Promise.all([
      prisma.emailEvent.findMany({
        where,
        orderBy: { eventDate: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          EmailRecipient: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.emailEvent.count({ where }),
    ]);

    // Statistiques par type d'événement
    const eventStats = await prisma.emailEvent.groupBy({
      by: ["eventType"],
      where: { campaignId: id },
      _count: true,
    });

    // Évolution temporelle des événements (par heure pour les dernières 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const timelineEvents = await prisma.emailEvent.findMany({
      where: {
        campaignId: id,
        eventDate: { gte: last24h },
      },
      select: {
        eventType: true,
        eventDate: true,
      },
      orderBy: { eventDate: "asc" },
    });

    // Grouper par heure
    const timeline: Record<string, Record<string, number>> = {};
    timelineEvents.forEach((event) => {
      const hour = new Date(event.eventDate).toISOString().slice(0, 13) + ":00";
      if (!timeline[hour]) {
        timeline[hour] = { open: 0, click: 0, bounce: 0, delivered: 0 };
      }
      if (event.eventType in timeline[hour]) {
        timeline[hour][event.eventType]++;
      }
    });

    // Convertir en tableau
    const timelineArray = Object.entries(timeline).map(([hour, counts]) => ({
      hour,
      ...counts,
    }));

    // Top liens cliqués
    const clickEvents = await prisma.emailEvent.findMany({
      where: {
        campaignId: id,
        eventType: "click",
        url: { not: null },
      },
      select: { url: true },
    });

    const linkCounts: Record<string, number> = {};
    clickEvents.forEach((event) => {
      if (event.url) {
        linkCounts[event.url] = (linkCounts[event.url] || 0) + 1;
      }
    });

    const topLinks = Object.entries(linkCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: eventStats.reduce((acc, stat) => {
        acc[stat.eventType] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      timeline: timelineArray,
      topLinks,
    });
  } catch (error) {
    console.error("Error fetching campaign events:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign events" },
      { status: 500 }
    );
  }
}

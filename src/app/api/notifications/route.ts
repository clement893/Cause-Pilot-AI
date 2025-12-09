import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    
    if (unreadOnly) {
      where.isRead = false;
      where.isDismissed = false;
    }
    
    if (category) {
      where.category = category;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        isRead: false,
        isDismissed: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// POST - Créer une notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const notification = await prisma.notification.create({
      data: {
        type: body.type,
        category: body.category,
        priority: body.priority || "MEDIUM",
        title: body.title,
        message: body.message,
        actionUrl: body.actionUrl,
        actionLabel: body.actionLabel,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        donorId: body.donorId,
        campaignId: body.campaignId,
        donationId: body.donationId,
        formId: body.formId,
        userId: body.userId,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH - Mettre à jour une notification (marquer comme lue/rejetée)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.isRead !== undefined) {
      updateData.isRead = body.isRead;
      if (body.isRead) {
        updateData.readAt = new Date();
      }
    }

    if (body.isDismissed !== undefined) {
      updateData.isDismissed = body.isDismissed;
      if (body.isDismissed) {
        updateData.dismissedAt = new Date();
      }
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la notification" },
      { status: 500 }
    );
  }
}

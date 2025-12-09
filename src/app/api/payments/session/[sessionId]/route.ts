import { NextRequest, NextResponse } from "next/server";
import { getCheckoutSession } from "@/lib/stripe";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = await getCheckoutSession(sessionId);

    return NextResponse.json({
      amount: (session.amount_total || 0) / 100,
      email: session.customer_email || "",
      formName: session.metadata?.formName || "",
      campaignName: session.metadata?.campaignName || undefined,
      isRecurring: session.mode === "subscription",
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session details" },
      { status: 500 }
    );
  }
}

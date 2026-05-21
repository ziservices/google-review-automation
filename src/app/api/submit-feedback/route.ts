import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { businessId, rating, feedbackText, flowId } = body;

    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
    }

    // Sanitize and limit feedback text length
    const sanitizedText = typeof feedbackText === "string"
      ? feedbackText.trim().slice(0, 2000)
      : "";

    const admin = getSupabaseAdmin();

    // Insert feedback
    const { error: fbError } = await admin.from("feedback").insert({
      business_id: businessId,
      rating: ratingNum,
      feedback_text: sanitizedText,
    });
    if (fbError) throw fbError;

    // If flowId provided, link the feedback to the review flow row
    if (flowId && typeof flowId === "string") {
      await admin
        .from("reviews_flow")
        .update({ feedback_submitted: true })
        .eq("id", flowId)
        .eq("business_id", businessId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

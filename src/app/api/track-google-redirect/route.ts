import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { businessId, flowId } = body;

    if (!flowId || typeof flowId !== "string") {
      return NextResponse.json({ error: "flowId required" }, { status: 400 });
    }
    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    // Use admin client so RLS never silently blocks the update
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("reviews_flow")
      .update({ submitted_to_google: true })
      .eq("id", flowId)
      .eq("business_id", businessId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track redirect error:", error);
    return NextResponse.json({ error: "Failed to track redirect" }, { status: 500 });
  }
}

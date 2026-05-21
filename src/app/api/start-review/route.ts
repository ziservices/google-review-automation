import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.businessId || typeof body.businessId !== "string") {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }
    const rating = Number(body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("reviews_flow")
      .insert({
        business_id: body.businessId,
        rating,
        submitted_to_google: false,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ flowId: data.id });
  } catch (e) {
    console.error("Start review error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

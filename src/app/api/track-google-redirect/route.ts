import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { businessId, flowId } = await req.json();

    if (!flowId) {
      return NextResponse.json({ error: "flowId required" }, { status: 400 });
    }

    const { error } = await supabase
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
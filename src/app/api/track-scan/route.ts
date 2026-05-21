import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.businessId || typeof body.businessId !== "string") {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    await admin.from("scan_logs").insert({
      business_id: body.businessId,
      user_agent: typeof body.userAgent === "string" ? body.userAgent.slice(0, 500) : "",
      device_type: body.deviceType === "mobile" ? "mobile" : "desktop",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Track scan error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

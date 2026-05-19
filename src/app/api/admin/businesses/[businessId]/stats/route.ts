import { NextRequest, NextResponse } from "next/server";
import { aggregateAnalytics } from "@/lib/analytics";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { validateSuperAdminRequest } from "@/lib/super-admin-auth";

type Ctx = { params: Promise<{ businessId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { businessId } = await ctx.params;

  let allowed = validateSuperAdminRequest(req);
  if (!allowed) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const admin = getSupabaseAdmin();
        const { data: row } = await admin
          .from("businesses")
          .select("id")
          .eq("id", businessId)
          .eq("owner_email", user.email.trim().toLowerCase())
          .maybeSingle();
        allowed = !!row;
      }
    } catch {
      allowed = false;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: business, error: berr } = await admin
      .from("businesses")
      .select("id, name, custom_url_slug, plan, is_active, owner_email")
      .eq("id", businessId)
      .single();
    if (berr || !business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const [scansRes, reviewsRes, feedbackRes] = await Promise.all([
      admin.from("scan_logs").select("created_at, device_type").eq("business_id", businessId),
      admin
        .from("reviews_flow")
        .select("rating, submitted_to_google, created_at, selected_tags")
        .eq("business_id", businessId),
      admin.from("feedback").select("id, rating, feedback_text, created_at").eq("business_id", businessId),
    ]);

    if (scansRes.error) return NextResponse.json({ error: scansRes.error.message }, { status: 500 });
    if (reviewsRes.error) return NextResponse.json({ error: reviewsRes.error.message }, { status: 500 });
    if (feedbackRes.error) return NextResponse.json({ error: feedbackRes.error.message }, { status: 500 });

    const stats = aggregateAnalytics(
      (scansRes.data ?? []) as Parameters<typeof aggregateAnalytics>[0],
      (reviewsRes.data ?? []) as Parameters<typeof aggregateAnalytics>[1],
      (feedbackRes.data ?? []) as Parameters<typeof aggregateAnalytics>[2],
    );

    return NextResponse.json({ business, stats });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 503 });
  }
}

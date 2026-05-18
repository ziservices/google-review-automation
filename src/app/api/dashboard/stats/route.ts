import { NextResponse } from "next/server";
import { aggregateAnalytics } from "@/lib/analytics";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const email = user.email.trim().toLowerCase();
    const { data: businesses, error: be } = await admin
      .from("businesses")
      .select("id, name, custom_url_slug, plan")
      .eq("owner_email", email)
      .limit(1);

    if (be) return NextResponse.json({ error: be.message }, { status: 500 });
    const business = businesses?.[0];
    if (!business) {
      return NextResponse.json(
        { error: "No business is linked to this login. Ask your admin to set owner_email on your account." },
        { status: 404 },
      );
    }

    const bid = business.id;
    const [scansRes, reviewsRes, feedbackRes] = await Promise.all([
      admin.from("scan_logs").select("created_at, device_type").eq("business_id", bid),
      admin
        .from("reviews_flow")
        .select("rating, submitted_to_google, created_at, selected_tags")
        .eq("business_id", bid),
      admin.from("feedback").select("id, rating, feedback_text, created_at").eq("business_id", bid),
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
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

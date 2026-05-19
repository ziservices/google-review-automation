import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdmin();
  const { data: business, error } = await admin
    .from("businesses")
    .select("*")
    .eq("owner_email", user.email?.toLowerCase())
    .maybeSingle();

  if (!business || error) {
    return (
      <main style={{ minHeight: "100vh", background: "#F7F7F7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1C1C1C", marginBottom: 8 }}>No business found</h1>
          <p style={{ color: "#A0A0A0", fontSize: 14 }}>Logged in as: {user.email}</p>
        </div>
      </main>
    );
  }

  const [feedbackRes, reviewFlowsRes, scanLogsRes] = await Promise.all([
    admin.from("feedback").select("*").eq("business_id", business.id),
    admin.from("reviews_flow").select("*").eq("business_id", business.id),
    admin.from("scan_logs").select("*").eq("business_id", business.id),
  ]);

  const feedbacks   = feedbackRes.data ?? [];
  const reviewFlows = reviewFlowsRes.data ?? [];
  const scanLogs    = scanLogsRes.data ?? [];

  const totalScans      = scanLogs.length;
  const totalRatings    = reviewFlows.length;
  const googleRedirects = reviewFlows.filter(r => r.submitted_to_google).length;
  const avgRating       = totalRatings > 0
    ? (reviewFlows.reduce((s, r) => s + r.rating, 0) / totalRatings).toFixed(1)
    : "—";
  const conversionRate  = totalScans > 0 ? Math.round((googleRedirects / totalScans) * 100) : 0;
  const recentFeedbacks = feedbacks.slice(-5).reverse();

  return (
    <DashboardClient
      business={business}
      totalScans={totalScans}
      totalRatings={totalRatings}
      googleRedirects={googleRedirects}
      conversionRate={conversionRate}
      avgRating={avgRating}
      recentFeedbacks={recentFeedbacks}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
    />
  );
}

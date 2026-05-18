import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import QRCodeCard from "@/components/QRCodeCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_email", user.email?.toLowerCase())
    .maybeSingle();

  if (!business || error) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0C0C0C !important; }
        `}</style>
        <main style={{ minHeight: "100vh", background: "#0C0C0C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🔍</div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, color: "#E7E7E7", marginBottom: 10 }}>No business found</h1>
            <p style={{ color: "#A0A0A0", fontSize: 14 }}>Logged in as: {user.email}</p>
          </div>
        </main>
      </>
    );
  }

  const { data: feedbacks } = await supabase.from("feedback").select("*").eq("business_id", business.id);
  const { data: reviewFlows } = await supabase.from("reviews_flow").select("*").eq("business_id", business.id);
  const { data: scanLogs } = await supabase.from("scan_logs").select("*").eq("business_id", business.id);

  const totalScans = scanLogs?.length ?? 0;
  const totalRatings = reviewFlows?.length ?? 0;
  const googleRedirects = reviewFlows?.filter(r => r.submitted_to_google).length ?? 0;
  const avgRating = totalRatings > 0
    ? (reviewFlows!.reduce((s, r) => s + r.rating, 0) / totalRatings).toFixed(1)
    : "—";
  const conversionRate = totalScans > 0 ? Math.round((googleRedirects / totalScans) * 100) : 0;
  const recentFeedbacks = feedbacks?.slice(-5).reverse() ?? [];

  const planColors: Record<string, string> = {
    basic: "#A0A0A0",
    pro: "#F66E12",
    enterprise: "#FF9500",
  };
  const planColor = planColors[business.plan] ?? "#A0A0A0";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0C0C0C !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .stat-card { animation: fadeUp 0.4s ease both; }
        .stat-card:hover {
          border-color: rgba(246,110,18,0.25) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(246,110,18,0.08) !important;
          transition: all 0.2s;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(246,110,18,0.2); border-radius: 99px; }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#0C0C0C", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Sidebar */}
        <div style={{
          position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
          background: "#1C1C1C",
          borderRight: "1px solid rgba(246,110,18,0.1)",
          display: "flex", flexDirection: "column", padding: "24px 16px", zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, paddingLeft: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg,#FF9500,#FF0000)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(246,110,18,0.35)",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: "#E7E7E7", letterSpacing: "-0.03em" }}>ReviewFlow</span>
          </div>

          {/* Nav */}
          {[
            { icon: "▦", label: "Dashboard", active: true },
            { icon: "◎", label: "QR Code", active: false },
            { icon: "✦", label: "Analytics", active: false },
            { icon: "✉", label: "Feedback", active: false },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, marginBottom: 4, cursor: "pointer",
              background: item.active ? "rgba(246,110,18,0.12)" : "transparent",
              border: item.active ? "1px solid rgba(246,110,18,0.3)" : "1px solid transparent",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 13, color: item.active ? "#F66E12" : "#A0A0A0" }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: item.active ? 600 : 400, color: item.active ? "#E7E7E7" : "#A0A0A0" }}>{item.label}</span>
            </div>
          ))}

          {/* Account */}
          <div style={{ marginTop: "auto" }}>
            <div style={{ height: 1, background: "rgba(246,110,18,0.1)", marginBottom: 16 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg,#FF9500,#FF0000)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff",
                boxShadow: "0 2px 8px rgba(246,110,18,0.3)",
              }}>
                {business.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#E7E7E7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{business.name}</p>
                <p style={{ fontSize: 10, color: "#A0A0A0", textTransform: "capitalize" }}>{business.plan} plan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ marginLeft: 220, padding: "32px 40px", minHeight: "100vh" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, animation: "fadeUp 0.4s ease both" }}>
            <div>
              <p style={{ fontSize: 12, color: "#A0A0A0", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Good to see you back</p>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#E7E7E7", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                {business.name}
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Active badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 14px", borderRadius: 99,
                background: business.is_active ? "rgba(22,163,74,0.12)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${business.is_active ? "rgba(22,163,74,0.3)" : "rgba(239,68,68,0.25)"}`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: business.is_active ? "#22c55e" : "#ef4444", animation: business.is_active ? "pulse 2s infinite" : "none" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: business.is_active ? "#22c55e" : "#ef4444" }}>
                  {business.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {/* Plan badge */}
              <div style={{
                padding: "8px 14px", borderRadius: 99,
                background: `${planColor}18`,
                border: `1px solid ${planColor}40`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: planColor, textTransform: "capitalize" }}>
                  {business.plan} Plan
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
            {[
              { label: "QR Scans", value: totalScans, icon: "📱", delay: "0s" },
              { label: "Ratings", value: totalRatings, icon: "⭐", delay: "0.07s" },
              { label: "Google Redirects", value: googleRedirects, icon: "🔗", delay: "0.14s" },
              { label: "Conversion", value: `${conversionRate}%`, icon: "📈", delay: "0.21s" },
              { label: "Avg Rating", value: avgRating, icon: "✦", delay: "0.28s" },
            ].map(stat => (
              <div key={stat.label} className="stat-card" style={{
                background: "#1C1C1C",
                border: "1px solid rgba(246,110,18,0.08)",
                borderRadius: 18, padding: "20px",
                animationDelay: stat.delay,
              }}>
                <p style={{ fontSize: 20, marginBottom: 12 }}>{stat.icon}</p>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#E7E7E7", letterSpacing: "-0.04em", marginBottom: 4 }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: "#A0A0A0" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Bottom grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Review URL + QR */}
            <div style={{ background: "#1C1C1C", border: "1px solid rgba(246,110,18,0.08)", borderRadius: 20, padding: 24, animation: "fadeUp 0.4s 0.35s ease both", opacity: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Your Review Link</p>

              <div style={{ background: "rgba(246,110,18,0.06)", border: "1px solid rgba(246,110,18,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <p style={{ fontSize: 13, color: "#F66E12", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {process.env.NEXT_PUBLIC_APP_URL}/review/{business.custom_url_slug}
                </p>
                <button style={{ background: "rgba(246,110,18,0.15)", border: "1px solid rgba(246,110,18,0.3)", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, color: "#F66E12", cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}>
                  Copy
                </button>
              </div>

              <QRCodeCard businessName={business.name} slug={business.custom_url_slug} />
            </div>

            {/* Recent feedback */}
            <div style={{ background: "#1C1C1C", border: "1px solid rgba(246,110,18,0.08)", borderRadius: 20, padding: 24, animation: "fadeUp 0.4s 0.42s ease both", opacity: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Recent Private Feedback</p>

              {recentFeedbacks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ fontSize: 28, marginBottom: 10 }}>💬</p>
                  <p style={{ fontSize: 13, color: "#A0A0A0" }}>No feedback yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentFeedbacks.map((fb: { id: string; rating: number; feedback_text: string; created_at: string }) => (
                    <div key={fb.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(246,110,18,0.08)", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i < fb.rating ? "#FF9500" : "none"} stroke={i < fb.rating ? "#FF9500" : "rgba(255,255,255,0.15)"} strokeWidth="2">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                        <span style={{ fontSize: 10, color: "#A0A0A0" }}>
                          {new Date(fb.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#D7D7D7", lineHeight: 1.5 }}>{fb.feedback_text || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
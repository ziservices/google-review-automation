"use client";

import { useState } from "react";
import QRCodeCard from "@/components/QRCodeCard";

const T = {
  primary:    "#F66E12",
  gradStart:  "#FF9500",
  gradEnd:    "#FF0000",
  bg:         "#F7F7F7",
  border:     "#E8E8E8",
  textPri:    "#1C1C1C",
  textSec:    "#A0A0A0",
  textMid:    "#5A5A5A",
  cardBg:     "#FFFFFF",
  sidebarBg:  "#FFFFFF",
  inputBg:    "#F4F4F4",
  orangeGlow: "0 6px 24px rgba(246,110,18,0.25)",
  shadow:     "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)",
};

const planMeta: Record<string, { color: string; bg: string; border: string }> = {
  basic:      { color: "#A0A0A0", bg: "rgba(160,160,160,0.1)",  border: "rgba(160,160,160,0.25)" },
  pro:        { color: T.primary, bg: "rgba(246,110,18,0.1)",   border: "rgba(246,110,18,0.25)" },
  enterprise: { color: "#FF9500", bg: "rgba(255,149,0,0.1)",    border: "rgba(255,149,0,0.25)" },
};

type Props = {
  business: { id: string; name: string; custom_url_slug: string; is_active?: boolean | null; plan?: string | null };
  totalScans: number; totalRatings: number; googleRedirects: number;
  conversionRate: number; avgRating: string;
  recentFeedbacks: { id: string; rating: number; feedback_text: string; created_at: string }[];
  appUrl: string;
};

export default function DashboardClient({
  business, totalScans, totalRatings, googleRedirects,
  conversionRate, avgRating, recentFeedbacks, appUrl,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const plan   = business.plan ?? "basic";
  const planC  = planMeta[plan] ?? planMeta.basic;
  const initial = business.name.charAt(0).toUpperCase();

  const stats = [
    { label: "QR Scans",         value: totalScans,          icon: "📱", delay: "0s" },
    { label: "Ratings",          value: totalRatings,         icon: "⭐", delay: "0.06s" },
    { label: "Google Redirects", value: googleRedirects,      icon: "🔗", delay: "0.12s" },
    { label: "Conversion",       value: `${conversionRate}%`, icon: "📈", delay: "0.18s" },
    { label: "Avg Rating",       value: avgRating,            icon: "✦",  delay: "0.24s" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse  { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        .stat-card { animation: fadeUp 0.45s ease both; transition: all 0.2s; }
        .stat-card:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(246,110,18,0.10)!important; border-color:rgba(246,110,18,0.25)!important; }
        .nav-item:hover { background: rgba(246,110,18,0.06)!important; }
        .fb-card:hover { border-color: rgba(246,110,18,0.2)!important; }
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(246,110,18,0.2);border-radius:99px;}
      `}</style>

      <main style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif" }}>

        {/* Overlay — tapping closes sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 150,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(2px)",
            }}
          />
        )}

        {/* Hamburger */}
        <button
          className="db-hamburger"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle menu"
          style={{ background: "none", border: "none", padding: 0 }}
        >
          {sidebarOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textPri} strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textPri} strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>

        {/* Sidebar */}
        <aside
          className={`db-sidebar${sidebarOpen ? " open" : ""}`}
          style={{
            background: T.sidebarBg,
            borderRight: `1px solid ${T.border}`,
            display: "flex", flexDirection: "column",
            padding: "28px 16px",
            boxShadow: "1px 0 0 rgba(0,0,0,0.03)",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, paddingLeft: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg,${T.gradStart},${T.gradEnd})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.orangeGlow, flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: T.textPri, letterSpacing: "-0.03em", lineHeight: 1 }}>ReviewFlow</p>
              <p style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>Business Dashboard</p>
            </div>
          </div>

          <p style={{ fontSize: 10, fontWeight: 600, color: T.textSec, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 12 }}>Menu</p>
          {[
            { icon: "▦", label: "Dashboard", active: true },
            { icon: "◎", label: "QR Code",   active: false },
            { icon: "✦", label: "Analytics", active: false },
            { icon: "✉", label: "Feedback",  active: false },
          ].map(item => (
            <div key={item.label} className="nav-item" onClick={() => setSidebarOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer", transition: "all 0.15s", background: item.active ? "rgba(246,110,18,0.10)" : "transparent", border: item.active ? "1px solid rgba(246,110,18,0.22)" : "1px solid transparent" }}>
              <span style={{ fontSize: 14, color: item.active ? T.primary : T.textSec, width: 18, textAlign: "center" }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: item.active ? 600 : 400, color: item.active ? T.textPri : T.textSec }}>{item.label}</span>
              {item.active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: T.primary }} />}
            </div>
          ))}

          <div style={{ height: 1, background: T.border, margin: "20px 0" }} />

          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: T.inputBg, border: `1px solid ${T.border}` }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${T.gradStart},${T.gradEnd})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: "0 2px 8px rgba(246,110,18,0.25)" }}>{initial}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.textPri, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{business.name}</p>
                <p style={{ fontSize: 10, color: T.textSec, textTransform: "capitalize", marginTop: 1 }}>{plan} plan</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="db-main">

          {/* Header */}
          <div className="db-header-row" style={{ animation: "fadeUp 0.4s ease both" }}>
            <div>
              <p style={{ fontSize: 11, color: T.textSec, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>Welcome back</p>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 30, fontWeight: 800, color: T.textPri, letterSpacing: "-0.04em", lineHeight: 1.1 }}>{business.name}</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 99, background: business.is_active ? "rgba(22,163,74,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${business.is_active ? "rgba(22,163,74,0.25)" : "rgba(239,68,68,0.2)"}` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: business.is_active ? "#22c55e" : "#ef4444", animation: business.is_active ? "pulse 2s infinite" : "none" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: business.is_active ? "#16a34a" : "#dc2626" }}>{business.is_active ? "Active" : "Inactive"}</span>
              </div>
              <div style={{ padding: "8px 14px", borderRadius: 99, background: planC.bg, border: `1px solid ${planC.border}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: planC.color, textTransform: "capitalize" }}>{plan} Plan</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="db-stats-grid">
            {stats.map(s => (
              <div key={s.label} className="stat-card" style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 18, padding: "22px 20px", boxShadow: T.shadow, animationDelay: s.delay }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(246,110,18,0.08)", border: "1px solid rgba(246,110,18,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 14 }}>{s.icon}</div>
                <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 800, color: T.textPri, letterSpacing: "-0.04em", marginBottom: 4 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: T.textSec, fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bottom grid */}
          <div className="db-bottom-grid" style={{ minWidth: 0 }}>

            {/* Review link + QR */}
            <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, boxShadow: T.shadow, animation: "fadeUp 0.4s 0.3s ease both", opacity: 0, overflow: "hidden", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Review Link</p>
              </div>
              <div style={{ background: "rgba(246,110,18,0.05)", border: "1px solid rgba(246,110,18,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                <p style={{ fontSize: 12, color: T.primary, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>{appUrl}/review/{business.custom_url_slug}</p>
                <button style={{ background: T.primary, border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, color: "#fff", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Copy</button>
              </div>
              <QRCodeCard businessName={business.name} slug={business.custom_url_slug} />
            </div>

            {/* Recent feedback */}
            <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, boxShadow: T.shadow, animation: "fadeUp 0.4s 0.38s ease both", opacity: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent Private Feedback</p>
              </div>
              {recentFeedbacks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: T.inputBg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 12px" }}>💬</div>
                  <p style={{ fontSize: 13, color: T.textSec }}>No feedback yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentFeedbacks.map(fb => (
                    <div key={fb.id} className="fb-card" style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px", transition: "all 0.15s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i < fb.rating ? T.gradStart : "none"} stroke={i < fb.rating ? T.gradStart : "#D7D7D7"} strokeWidth="2">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                        <span style={{ fontSize: 10, color: T.textSec }}>{new Date(fb.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                      </div>
                      <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.55 }}>{fb.feedback_text || "—"}</p>
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

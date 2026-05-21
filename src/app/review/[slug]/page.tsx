"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Business {
  id: string;
  name: string;
  place_id: string;
  custom_url_slug: string;
  logo_url?: string;
  is_active?: boolean | null;
  plan?: string | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ReviewPage({ params }: PageProps) {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inactive, setInactive] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
    params.then(({ slug }) => fetchBusiness(slug));
  }, [params]);

  async function fetchBusiness(slug: string) {
    try {
      const res = await fetch(`/api/review/${encodeURIComponent(slug)}/tags`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      // Use the tags endpoint to also verify the business exists — but we need business data
      // so fetch from a dedicated public endpoint
      const bizRes = await fetch(`/api/review/${encodeURIComponent(slug)}/info`);
      if (!bizRes.ok) { setNotFound(true); setLoading(false); return; }
      const bizData = await bizRes.json();
      if (!bizData.business) { setNotFound(true); setLoading(false); return; }
      if (bizData.business.is_active === false) { setInactive(true); setLoading(false); return; }
      setBusiness(bizData.business);
      setLoading(false);

      // Track scan via server-side API (bypasses RLS)
      await fetch("/api/track-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: bizData.business.id,
          userAgent: navigator.userAgent,
          deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
        }),
      });
    } catch {
      setNotFound(true);
      setLoading(false);
    }
  }

  async function handleStarClick(star: number) {
    if (navigating || !business) return;
    setSelectedStar(star);
    setNavigating(true);

    // Create review flow via server-side API (bypasses RLS)
    let flowId = "";
    try {
      const res = await fetch("/api/start-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, rating: star }),
      });
      const data = await res.json();
      flowId = data.flowId ?? "";
    } catch { /* continue without flowId */ }

    setTimeout(() => {
      if (star >= 4) {
        const plan = encodeURIComponent((business.plan ?? "basic").toString().toLowerCase());
        router.push(
          `/review-builder?rating=${star}&businessId=${business.id}&flowId=${flowId}&placeId=${business.place_id}&plan=${plan}`,
        );
      } else {
        router.push(`/feedback?rating=${star}&businessId=${business.id}&flowId=${flowId}`);
      }
    }, 600);
  }

  // ── Loading / error states ──────────────────────────────────────────────
  if (loading) return (
    <main style={styles.root}>
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
      </div>
    </main>
  );

  if (notFound) return (
    <main style={styles.root}>
      <div style={{ ...styles.card, textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ ...styles.bizName, fontSize: 20 }}>Business not found</h1>
        <p style={styles.subtext}>This review link does not exist.</p>
      </div>
    </main>
  );

  if (inactive) return (
    <main style={styles.root}>
      <div style={{ ...styles.card, textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
        <h1 style={{ ...styles.bizName, fontSize: 20 }}>Review page unavailable</h1>
        <p style={styles.subtext}>This business review link is temporarily disabled.</p>
      </div>
    </main>
  );

  const activeStars = hoveredStar || selectedStar;
  const labels = ["", "Poor", "Below average", "Average", "Good", "Excellent!"];
  const labelColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

  return (
    <main style={styles.root}>
      {/* Ambient background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={{
        ...styles.card,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(24px)",
        transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          {business?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt={business.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />
          ) : (
            <span style={styles.logoLetter}>{business?.name?.charAt(0).toUpperCase()}</span>
          )}
          <div style={styles.logoBadge}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>

        {/* Business name */}
        <h1 style={styles.bizName}>{business?.name}</h1>
        <p style={styles.subtext}>How was your experience today?</p>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Stars */}
        <div style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => !navigating && setHoveredStar(star)}
              onMouseLeave={() => !navigating && setHoveredStar(0)}
              onClick={() => handleStarClick(star)}
              disabled={navigating}
              style={{
                background: "none", border: "none",
                cursor: navigating ? "not-allowed" : "pointer",
                padding: "4px", borderRadius: 8,
                transform: hoveredStar >= star || selectedStar >= star ? "scale(1.15)" : "scale(1)",
                transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24"
                fill={star <= activeStars ? (activeStars >= 4 ? "#facc15" : activeStars === 3 ? "#fb923c" : "#f87171") : "none"}
                stroke={star <= activeStars ? (activeStars >= 4 ? "#f59e0b" : activeStars === 3 ? "#ea580c" : "#ef4444") : "#e2e8f0"}
                strokeWidth="1.5"
                style={{
                  filter: star <= activeStars ? "drop-shadow(0 2px 8px rgba(250,204,21,0.4))" : "none",
                  transition: "all 0.2s",
                }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
          ))}
        </div>

        {/* Star label */}
        <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          {activeStars > 0 && (
            <span style={{
              fontSize: 15, fontWeight: 600, color: labelColors[activeStars],
              background: `${labelColors[activeStars]}15`,
              padding: "4px 14px", borderRadius: 99,
              transition: "all 0.2s",
            }}>
              {labels[activeStars]}
            </span>
          )}
        </div>


        {/* CTA Button */}
        <button
          onClick={() => selectedStar > 0 && !navigating && handleStarClick(selectedStar)}
          disabled={selectedStar === 0 || navigating}
          style={{
            width: "100%", padding: "16px 24px", borderRadius: 16, border: "none",
            fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
            cursor: selectedStar === 0 ? "not-allowed" : "pointer",
            background: selectedStar > 0
              ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
              : "#f1f5f9",
            color: selectedStar > 0 ? "white" : "#94a3b8",
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
            boxShadow: selectedStar > 0
              ? "0 8px 32px rgba(15,52,96,0.35), 0 2px 8px rgba(15,52,96,0.2)"
              : "none",
            transform: selectedStar > 0 ? "translateY(-1px)" : "none",
          }}
        >
          {navigating ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Loading...
            </span>
          ) : "Continue →"}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 16, marginBottom: 0 }}>
          🔒 Your feedback is secure and private
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #faf8ff 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "24px 16px", position: "relative", overflow: "hidden",
  },
  blob1: {
    position: "absolute", top: "-20%", right: "-10%",
    width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: "-20%", left: "-10%",
    width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: 28,
    padding: "40px 36px 32px",
    maxWidth: 420, width: "100%",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 24px 80px rgba(15,23,42,0.1), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
    display: "flex", flexDirection: "column", alignItems: "center",
    position: "relative", zIndex: 1,
  },
  logoWrap: {
    width: 72, height: 72, borderRadius: 20,
    background: "linear-gradient(135deg, #1a1a2e, #0f3460)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 20, position: "relative",
    boxShadow: "0 8px 24px rgba(15,52,96,0.3)",
  },
  logoLetter: {
    fontSize: 28, fontWeight: 800, color: "white", letterSpacing: "-0.02em",
  },
  logoBadge: {
    position: "absolute", bottom: -6, right: -6,
    width: 22, height: 22, borderRadius: "50%",
    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid white",
    boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
  },
  bizName: {
    fontSize: 26, fontWeight: 800, color: "#0f172a",
    letterSpacing: "-0.03em", marginBottom: 6, textAlign: "center",
  },
  subtext: {
    fontSize: 14, color: "#64748b", marginBottom: 0, textAlign: "center",
  },
  divider: {
    width: 40, height: 3, borderRadius: 99,
    background: "linear-gradient(90deg, #6366f1, #ec4899)",
    margin: "24px 0",
  },
  starsRow: {
    display: "flex", gap: 6, marginBottom: 4,
  },
  loadingWrap: {
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid rgba(99,102,241,0.15)",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
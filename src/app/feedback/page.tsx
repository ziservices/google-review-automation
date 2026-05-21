"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";

const ISSUES = [
  "Slow service ⏱️", "Food quality 🍽️", "Wrong order ❌", "Cleanliness 🧹",
  "Rude staff 😤", "High prices 💸", "Long wait ⌛", "Noise level 🔊",
];

function FeedbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rating = parseInt(searchParams.get("rating") ?? "1");
  const businessId = searchParams.get("businessId") ?? "";
  const flowId = searchParams.get("flowId") ?? "";

  const [feedbackText, setFeedbackText] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleIssue(issue: string) {
    setSelectedIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/submit-feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          rating,
          flowId,
          feedbackText: [selectedIssues.join(", "), feedbackText].filter(Boolean).join(" — "),
        }),
      });
      router.push("/thank-you?type=feedback");
    } catch { setSubmitting(false); }
  }

  const ratingConfig: Record<number, { color: string; bg: string; label: string; emoji: string }> = {
    1: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", label: "Poor", emoji: "😞" },
    2: { color: "#f97316", bg: "rgba(249,115,22,0.08)", label: "Below average", emoji: "😕" },
    3: { color: "#eab308", bg: "rgba(234,179,8,0.08)", label: "Average", emoji: "😐" },
  };
  const cfg = ratingConfig[rating] ?? ratingConfig[1];

  return (
    <main style={fb.root}>
      <div style={fb.blob1} /><div style={fb.blob2} />

      <div style={{ ...fb.container, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Header */}
        <div style={fb.header}>
          {/* Rating pill */}
          <div style={{ ...fb.ratingPill, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
            <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
            <div style={fb.ratingStars}>
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                  fill={i < rating ? cfg.color : "none"}
                  stroke={i < rating ? cfg.color : "#e2e8f0"}
                  strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
          </div>

          <h1 style={fb.title}>We're sorry to hear that</h1>
          <p style={fb.subtitle}>Your private feedback helps us improve. It will never be posted publicly.</p>
        </div>

        {/* Issues */}
        <div style={fb.card}>
          <p style={fb.sectionLabel}>What went wrong?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ISSUES.map((issue) => (
              <button key={issue} onClick={() => toggleIssue(issue)} style={{
                padding: "9px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                border: selectedIssues.includes(issue) ? "none" : "1.5px solid #fecaca",
                background: selectedIssues.includes(issue) ? "linear-gradient(135deg, #ef4444, #f97316)" : "white",
                color: selectedIssues.includes(issue) ? "white" : "#dc2626",
                boxShadow: selectedIssues.includes(issue) ? "0 4px 14px rgba(239,68,68,0.3)" : "none",
                transform: selectedIssues.includes(issue) ? "scale(1.02)" : "scale(1)",
              }}>
                {issue}
              </button>
            ))}
          </div>
        </div>

        {/* Text feedback */}
        <div style={fb.card}>
          <p style={fb.sectionLabel}>Tell us more <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></p>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What could we have done better? Be as specific as you like..."
            rows={4}
            style={{
              width: "100%", resize: "none", borderRadius: 14,
              border: "1.5px solid #fee2e2", padding: "14px 16px",
              fontSize: 14, color: "#1e293b", lineHeight: 1.6,
              fontFamily: "inherit", outline: "none", background: "#fffafa",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#f87171"}
            onBlur={(e) => e.target.style.borderColor = "#fee2e2"}
          />
        </div>

        {/* Privacy note */}
        <div style={fb.privacyBox}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <p style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.5 }}>
            <strong>100% private.</strong> Your feedback goes directly to the business owner and will never be shared or posted publicly.
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || (selectedIssues.length === 0 && !feedbackText.trim())}
          style={{
            width: "100%", padding: "16px 24px", borderRadius: 16, border: "none",
            background: (selectedIssues.length > 0 || feedbackText.trim()) && !submitting
              ? "linear-gradient(135deg, #1a1a2e, #0f3460)"
              : "#f1f5f9",
            color: (selectedIssues.length > 0 || feedbackText.trim()) ? "white" : "#94a3b8",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: (selectedIssues.length > 0 || feedbackText.trim()) ? "0 8px 32px rgba(15,52,96,0.3)" : "none",
            transition: "all 0.3s", marginBottom: 12,
          }}
        >
          {submitting ? "Submitting..." : "Submit Private Feedback"}
        </button>

        <button
          onClick={() => router.push("/thank-you?type=skip")}
          style={{
            width: "100%", padding: "12px", background: "none", border: "none",
            fontSize: 14, color: "#94a3b8", cursor: "pointer",
            fontFamily: "inherit", transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#64748b")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          Skip for now →
        </button>

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system,'SF Pro Display',BlinkMacSystemFont,'Segoe UI',sans-serif; }
        textarea::placeholder { color: #fca5a5; }
      `}</style>
    </main>
  );
}

const fb: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh", padding: "32px 16px",
    background: "linear-gradient(135deg, #fff8f8 0%, #fff0f0 50%, #fffbff 100%)",
    position: "relative", overflow: "hidden",
  },
  blob1: {
    position: "fixed", top: "-15%", right: "-10%", width: 500, height: 500,
    borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "fixed", bottom: "-20%", left: "-10%", width: 600, height: 600,
    borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: { maxWidth: 520, margin: "0 auto", position: "relative", zIndex: 1 },
  header: { textAlign: "center", marginBottom: 24 },
  ratingPill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "8px 16px", borderRadius: 99, marginBottom: 16,
  },
  ratingStars: { display: "flex", gap: 2 },
  title: { fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748b", lineHeight: 1.5, maxWidth: 340, margin: "0 auto" },
  card: {
    background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)",
    borderRadius: 20, padding: "22px 24px", marginBottom: 14,
    boxShadow: "0 4px 24px rgba(239,68,68,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
    border: "1px solid rgba(255,220,220,0.6)",
  },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 },
  privacyBox: {
    display: "flex", alignItems: "flex-start", gap: 12,
    background: "#eff6ff", border: "1px solid #bfdbfe",
    borderRadius: 14, padding: "14px 16px", marginBottom: 16,
  },
};

export default function FeedbackPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff8f8" }}><div /></main>}>
      <FeedbackContent />
    </Suspense>
  );
}
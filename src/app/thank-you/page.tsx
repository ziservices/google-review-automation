"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

type Offer = {
  title: string;
  description: string;
  code: string;
  expiry: string;
  emoji: string;
};

function ThankYouContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "review";
  const slug = searchParams.get("slug") ?? "";
  const rating = parseInt(searchParams.get("rating") ?? "0");

  const [mounted, setMounted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [offerLoaded, setOfferLoaded] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (type === "review") setTimeout(() => setShowConfetti(true), 300);
  }, [type]);

  // Fetch offer only for 5-star reviews with a known slug
  useEffect(() => {
    if (type !== "review" || rating < 5 || !slug) {
      setOfferLoaded(true);
      return;
    }
    fetch(`/api/review/${encodeURIComponent(slug)}/offer`)
      .then(r => r.json())
      .then(json => {
        if (json.offer?.title) setOffer(json.offer);
      })
      .catch(() => {})
      .finally(() => setOfferLoaded(true));
  }, [type, rating, slug]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  const configs = {
    review: {
      emoji: "🎉", title: "Thank you for your review!",
      subtitle: "Your kind words help others discover this place on Google.",
      accent: "#6366f1", bg: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)",
      pillBg: "rgba(99,102,241,0.08)", pillColor: "#6366f1",
      pillText: "Review submitted", cardBorder: "rgba(99,102,241,0.15)",
      nextTitle: "One more step",
      nextText: "Your review was copied to clipboard. Head to Google and paste it to complete your review.",
      nextBg: "#f0fdf4", nextBorder: "#bbf7d0", nextColor: "#166534",
    },
    feedback: {
      emoji: "🙏", title: "Thank you for your honesty",
      subtitle: "Your private feedback has been sent directly to the team.",
      accent: "#3b82f6", bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      pillBg: "rgba(59,130,246,0.08)", pillColor: "#3b82f6",
      pillText: "Feedback received", cardBorder: "rgba(59,130,246,0.15)",
      nextTitle: "What happens next?",
      nextText: "The team will review your feedback and work on improvements. Your voice makes a real difference!",
      nextBg: "#eff6ff", nextBorder: "#bfdbfe", nextColor: "#1e40af",
    },
    skip: {
      emoji: "👋", title: "Thanks for visiting!",
      subtitle: "We hope to see you again soon.",
      accent: "#64748b", bg: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      pillBg: "rgba(100,116,139,0.08)", pillColor: "#64748b",
      pillText: "See you next time", cardBorder: "rgba(100,116,139,0.15)",
      nextTitle: "", nextText: "", nextBg: "", nextBorder: "", nextColor: "",
    },
  };

  const c = configs[type as keyof typeof configs] ?? configs.review;
  const confettiColors = ["#6366f1", "#ec4899", "#f59e0b", "#22c55e", "#3b82f6"];

  return (
    <main style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden" }}>

      {/* Confetti */}
      {showConfetti && type === "review" && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${(i * 3.7) % 100}%`,
              top: `-${(i % 3) * 8 + 5}%`,
              width: (i % 3) * 4 + 6,
              height: (i % 3) * 4 + 6,
              background: confettiColors[i % confettiColors.length],
              borderRadius: i % 2 === 0 ? "50%" : "2px",
              opacity: 0.8,
              animation: `fall ${(i % 3) * 0.8 + 2}s ease-in ${(i % 5) * 0.3}s forwards`,
            }} />
          ))}
        </div>
      )}

      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${c.accent}12 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${c.accent}08 0%, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{
        maxWidth: 420, width: "100%", textAlign: "center", position: "relative", zIndex: 1,
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* Emoji circle */}
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: c.pillBg, border: `2px solid ${c.accent}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 48, margin: "0 auto 24px",
          boxShadow: `0 8px 32px ${c.accent}20`,
          animation: mounted ? "bounceIn 0.6s cubic-bezier(0.16,1.5,0.3,1) 0.1s both" : "none",
        }}>
          {c.emoji}
        </div>

        {/* Status pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 99, marginBottom: 18,
          background: c.pillBg, border: `1px solid ${c.accent}25`,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.accent, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: c.accent }}>{c.pillText}</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 12, fontFamily: "-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif" }}>
          {c.title}
        </h1>
        <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, marginBottom: 28, fontFamily: "-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif" }}>
          {c.subtitle}
        </p>

        {/* Next step card */}
        {c.nextText && (
          <div style={{
            background: c.nextBg, border: `1px solid ${c.nextBorder}`,
            borderRadius: 16, padding: "16px 20px", marginBottom: 20, textAlign: "left",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: c.nextColor, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              {c.nextTitle}
            </p>
            <p style={{ fontSize: 14, color: c.nextColor, lineHeight: 1.6, fontFamily: "-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif" }}>
              {c.nextText}
            </p>
          </div>
        )}

        {/* ── Reward Offer Card (5-star only) ─────────────────────────── */}
        {type === "review" && rating >= 5 && offerLoaded && offer && (
          <div style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: "1.5px solid #fcd34d",
            borderRadius: 20,
            padding: "22px 24px",
            marginBottom: 20,
            textAlign: "left",
            boxShadow: "0 8px 32px rgba(245,158,11,0.15)",
            animation: "slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Decorative shimmer strip */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
              borderRadius: "20px 20px 0 0",
            }} />

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
                boxShadow: "0 4px 12px rgba(245,158,11,0.35)",
              }}>
                {offer.emoji}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
                  🎁 Your 5-Star Reward
                </p>
                <p style={{ fontSize: 17, fontWeight: 800, color: "#78350f", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  {offer.title}
                </p>
              </div>
            </div>

            {/* Description */}
            {offer.description && (
              <p style={{ fontSize: 14, color: "#92400e", lineHeight: 1.6, marginBottom: 14 }}>
                {offer.description}
              </p>
            )}

            {/* Promo code */}
            {offer.code && (
              <button
                onClick={() => copyCode(offer.code)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "12px 16px",
                  background: codeCopied ? "#d1fae5" : "rgba(255,255,255,0.8)",
                  border: `1.5px dashed ${codeCopied ? "#34d399" : "#fcd34d"}`,
                  borderRadius: 12, cursor: "pointer",
                  transition: "all 0.2s", marginBottom: offer.expiry ? 12 : 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{codeCopied ? "✅" : "🏷️"}</span>
                  <span style={{
                    fontSize: 16, fontWeight: 800, letterSpacing: "0.12em",
                    color: codeCopied ? "#065f46" : "#78350f",
                    fontFamily: "monospace",
                  }}>
                    {offer.code}
                  </span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: codeCopied ? "#065f46" : "#b45309",
                  background: codeCopied ? "#a7f3d0" : "#fef3c7",
                  padding: "4px 10px", borderRadius: 99,
                  border: `1px solid ${codeCopied ? "#6ee7b7" : "#fcd34d"}`,
                  transition: "all 0.2s",
                }}>
                  {codeCopied ? "Copied!" : "Tap to copy"}
                </span>
              </button>
            )}

            {/* Expiry */}
            {offer.expiry && (
              <p style={{ fontSize: 12, color: "#b45309", marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                <span>⏰</span> Valid until: <strong>{offer.expiry}</strong>
              </p>
            )}
          </div>
        )}

        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 14, color: "#94a3b8", textDecoration: "none",
          transition: "color 0.2s",
          fontFamily: "-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif",
        }}>
          ← Back to home
        </Link>
      </div>

      <style>{`
        @keyframes fall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounceIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", background: "#f8faff" }} />}>
      <ThankYouContent />
    </Suspense>
  );
}

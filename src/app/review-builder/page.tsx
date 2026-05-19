"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect, useCallback, useRef, useMemo } from "react";
import { getSupabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ServiceTag = { id: string; emoji: string; label: string };

const DEFAULT_SERVICE_TAGS: ServiceTag[] = [
  { id: "ds1", emoji: "🛠️", label: "Service" },
  { id: "ds2", emoji: "📦", label: "Product" },
];

const DEFAULT_CATEGORY_TAGS: ServiceTag[] = [
  { id: "d1", emoji: "😊", label: "Friendly Staff" },
  { id: "d2", emoji: "✨", label: "Clean & Tidy" },
  { id: "d3", emoji: "⚡", label: "Fast Service" },
  { id: "d4", emoji: "💰", label: "Great Value" },
  { id: "d5", emoji: "🏆", label: "Professional" },
  { id: "d6", emoji: "❤️", label: "Caring" },
];

const VARIANT_TONES = ["friendly", "casual", "formal"] as const;
const VARIANT_HINTS = [
  "Open with what specifically impressed you about the service. Use a personal, first-person angle.",
  "Open with the overall atmosphere or vibe. Keep it short and conversational, like texting a friend.",
  "Open with the outcome or result you got. Be direct and factual, then close with a recommendation.",
] as const;

function ReviewBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const rating = parseInt(searchParams.get("rating") ?? "5");
  const businessId = searchParams.get("businessId") ?? "";
  const flowId = searchParams.get("flowId") ?? "";
  const placeId = searchParams.get("placeId") ?? "";
  const maxTagSelections = 3;

  // Fetch business slug and custom tags
  useEffect(() => {
    if (!businessId) return;
    
    async function fetchBusinessAndTags() {
      const supabase = getSupabase();
      const { data: business, error } = await supabase
        .from("businesses")
        .select("custom_url_slug")
        .eq("id", businessId)
        .single();

      if (error || !business) {
        setServiceTags(DEFAULT_SERVICE_TAGS);
        setCategoryTags(DEFAULT_CATEGORY_TAGS);
        setTagsLoaded(true);
        return;
      }

      setBusinessSlug(business.custom_url_slug);

      try {
        const res = await fetch(`/api/review/${business.custom_url_slug}/tags`);
        if (res.ok) {
          const json = await res.json();
          setServiceTags(json.serviceTags && json.serviceTags.length > 0 ? json.serviceTags : DEFAULT_SERVICE_TAGS);
          setCategoryTags(json.categoryTags && json.categoryTags.length > 0 ? json.categoryTags : DEFAULT_CATEGORY_TAGS);
        } else {
          setServiceTags(DEFAULT_SERVICE_TAGS);
          setCategoryTags(DEFAULT_CATEGORY_TAGS);
        }
      } catch {
        setServiceTags(DEFAULT_SERVICE_TAGS);
        setCategoryTags(DEFAULT_CATEGORY_TAGS);
      } finally {
        setTagsLoaded(true);
      }
    }

    fetchBusinessAndTags();
  }, [businessId]);

  const [selectedServiceTag, setSelectedServiceTag] = useState<string | null>(null);
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<string[]>([]);
  const [serviceTags, setServiceTags] = useState<ServiceTag[]>(DEFAULT_SERVICE_TAGS);
  const [categoryTags, setCategoryTags] = useState<ServiceTag[]>(DEFAULT_CATEGORY_TAGS);
  const [businessSlug, setBusinessSlug] = useState<string>("");

  const selectedTags = useMemo(() => [selectedServiceTag, ...selectedCategoryTags].filter(Boolean) as string[], [selectedServiceTag, selectedCategoryTags]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [generatingPair, setGeneratingPair] = useState(false);
  const [generatingThird, setGeneratingThird] = useState(false);
  const [reviewVariants, setReviewVariants] = useState<(string | null)[]>([null, null, null]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);

  const reviewVariantsRef = useRef(reviewVariants);
  reviewVariantsRef.current = reviewVariants;
  const workflowGenId = useRef(0);
  const lastPairKeyRef = useRef<string | null>(null);
  const lastTripleKeyRef = useRef<string | null>(null);
  const lastManualSlideRef = useRef<number>(0); // timestamp of last manual slide

  function toggleServiceTag(tagId: string) {
    setSelectedServiceTag(prev => prev === tagId ? null : tagId);
    if (activeStep === 1 && selectedCategoryTags.length > 0) setActiveStep(2);
  }

  function toggleCategoryTag(tagId: string) {
    setSelectedCategoryTags(prev => {
      if (prev.includes(tagId)) return prev.filter(t => t !== tagId);
      if (prev.length >= maxTagSelections) return prev;
      return [...prev, tagId];
    });
    if (activeStep === 1 && selectedServiceTag) setActiveStep(2);
  }

  const tagLabelsFrom = useCallback(
    (tagIds: string[]) => {
      const allTags = [...serviceTags, ...categoryTags];
      return tagIds.map((id) => {
        const tag = allTags.find(t => t.id === id);
        return tag ? tag.label : id;
      });
    },
    [serviceTags, categoryTags]
  );

  // Returns { serviceLabel, categoryLabels } so the API can use them correctly
  const tagPayloadFrom = useCallback(
    (tagIds: string[]) => {
      const serviceLabel = tagIds
        .map(id => serviceTags.find(t => t.id === id))
        .filter(Boolean)
        .map(t => t!.label)[0] ?? null;
      const categoryLabels = tagIds
        .map(id => categoryTags.find(t => t.id === id))
        .filter(Boolean)
        .map(t => t!.label);
      return { serviceLabel, categoryLabels };
    },
    [serviceTags, categoryTags]
  );

  const fetchReviewSlot = useCallback(
    async (slotIndex: 0 | 1 | 2, tagIds: string[]) => {
      const tone = VARIANT_TONES[slotIndex];
      const variantHint = VARIANT_HINTS[slotIndex];
      const { serviceLabel, categoryLabels } = tagPayloadFrom(tagIds);
      let text = "";
      try {
        const res = await fetch("/api/generate-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, serviceTag: serviceLabel, categoryTags: categoryLabels, tone, variantHint }),
        });
        const data = await res.json();
        text = typeof data.review === "string" ? data.review : "";
      } catch {
        text =
          "Had a great experience! The service was excellent and the team was very helpful. Highly recommended!";
      }
      return text || null;
    },
    [rating, tagPayloadFrom]
  );

  useEffect(() => {
    const runId = ++workflowGenId.current;
    const tagsKey = [...selectedTags].sort().join("\0");
    const n = selectedTags.length;

    const fallback =
      "Had a great experience! The service was excellent and the team was very helpful. Highly recommended!";

    if (n < 2) {
      lastPairKeyRef.current = null;
      lastTripleKeyRef.current = null;
      setGeneratingPair(false);
      setGeneratingThird(false);
      setReviewVariants([null, null, null]);
      setSelectedVariantIndex(null);
      setReviewText("");
      return;
    }

    if (n === 2) {
      const samePairAsStored =
        tagsKey === lastPairKeyRef.current &&
        reviewVariantsRef.current[0] &&
        reviewVariantsRef.current[1];

      if (samePairAsStored) {
        setReviewVariants((prev) => [prev[0], prev[1], null]);
        lastTripleKeyRef.current = null;
        setGeneratingThird(false);
        return;
      }

      void (async () => {
        setGeneratingPair(true);
        setGeneratingThird(false);
        lastTripleKeyRef.current = null;
        setReviewVariants([null, null, null]);
        const [a, b] = await Promise.all([
          fetchReviewSlot(0, selectedTags),
          fetchReviewSlot(1, selectedTags),
        ]);
        if (runId !== workflowGenId.current) return;
        const v0 = a ?? fallback;
        const v1 = b ?? fallback;
        lastPairKeyRef.current = tagsKey;
        setReviewVariants([v0, v1, null]);
        setGeneratingPair(false);
        setSelectedVariantIndex(0);
        setReviewText(v0);
        setActiveStep(3);
      })();
      return;
    }

    void (async () => {
      let p0 = reviewVariantsRef.current[0];
      let p1 = reviewVariantsRef.current[1];

      if (!p0 || !p1) {
        lastTripleKeyRef.current = null;
        setGeneratingPair(true);
        setGeneratingThird(false);
        setReviewVariants([null, null, null]);
        const [a, b] = await Promise.all([
          fetchReviewSlot(0, selectedTags),
          fetchReviewSlot(1, selectedTags),
        ]);
        if (runId !== workflowGenId.current) return;
        p0 = a ?? fallback;
        p1 = b ?? fallback;
        setReviewVariants([p0, p1, null]);
        setGeneratingPair(false);
        setSelectedVariantIndex(0);
        setReviewText(p0);
        setActiveStep(3);
      }

      if (tagsKey === lastTripleKeyRef.current) {
        setGeneratingThird(false);
        return;
      }

      setGeneratingThird(true);
      setReviewVariants([p0, p1, null]);
      const t2 = await fetchReviewSlot(2, selectedTags);
      if (runId !== workflowGenId.current) return;
      const third = t2 ?? fallback;
      lastTripleKeyRef.current = tagsKey;
      setReviewVariants([p0, p1, third]);
      setGeneratingThird(false);
      setSelectedVariantIndex(2);
      setReviewText(third);
      setActiveStep(3);
    })();
  }, [selectedTags, fetchReviewSlot]);

  function selectVariant(slotIndex: number, text: string) {
    setSelectedVariantIndex(slotIndex);
    setReviewText(text);
    setActiveStep(3);
  }

  const readyForReviews = selectedServiceTag !== null && selectedCategoryTags.length >= 1;
  const hasThirdTag = selectedTags.length >= 3;
  const showThirdRow = readyForReviews;
  const totalSlides = showThirdRow ? 3 : 2;

  useEffect(() => {
    if (activeSlide >= totalSlides) {
      setActiveSlide(Math.max(0, totalSlides - 1));
    }
  }, [totalSlides, activeSlide]);

  // Auto-advance slide every 5 seconds when reviews are ready and user hasn't selected one
  useEffect(() => {
    if (!readyForReviews || generatingPair) return;
    const timer = setInterval(() => {
      // Pause auto-scroll for 8s after any manual interaction
      if (Date.now() - lastManualSlideRef.current < 8000) return;
      setActiveSlide(s => {
        const next = s + 1;
        return next >= totalSlides ? 0 : next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [readyForReviews, generatingPair, totalSlides]);

  async function copyAndRedirect() {
    if (!reviewText.trim() || submitting) return;
    const supabase = getSupabase();
    setSubmitting(true);
    try { await navigator.clipboard.writeText(reviewText); } catch { /* continue */ }
    await supabase.from("reviews_flow").update({
      selected_tags: selectedTags, generated_text: reviewText, submitted_to_google: true,
    }).eq("id", flowId);
    await fetch("/api/track-google-redirect", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, flowId }),
    });
    setTimeout(() => {
      window.open(
  `https://search.google.com/local/writereview?placeid=${placeId}`
)
      router.push(`/thank-you?type=review&slug=${encodeURIComponent(businessSlug)}&rating=${rating}`);
    }, 600);
  }

  const ratingColor = rating >= 4 ? "#16a34a" : rating === 3 ? "#d97706" : "#dc2626";

  return (
    <main style={rb.root}>
      <div style={rb.bg1} /><div style={rb.bg2} />

      <div style={{ ...rb.container, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Header */}
        <div style={rb.header}>
          <div style={rb.starsRow}>
            {Array.from({ length: 5 }, (_, i) => (
              <svg key={i} width="20" height="20" viewBox="0 0 24 24"
                fill={i < rating ? "#facc15" : "none"}
                stroke={i < rating ? "#f59e0b" : "#e2e8f0"}
                strokeWidth="1.5"
                style={{ filter: i < rating ? "drop-shadow(0 1px 4px rgba(250,204,21,0.5))" : "none" }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: ratingColor }}>
              {rating} star{rating > 1 ? "s" : ""}
            </span>
          </div>
          <h1 style={rb.title}>Share your experience</h1>
          <p style={rb.subtitle}>A few seconds to help others discover this place</p>
        </div>

        {/* Step 1 — Tags */}
        <div style={{ ...rb.card, border: activeStep === 1 ? "1.5px solid #6366f1" : "1.5px solid transparent", boxShadow: activeStep === 1 ? "0 8px 24px rgba(99,102,241,0.12)" : rb.card.boxShadow }}>
          <div style={rb.stepHeader}>
            <div style={{ ...rb.stepBadge, background: activeStep >= 1 ? "#6366f1" : "#f1f5f9" }}>
              <span style={{ color: activeStep >= 1 ? "white" : "#94a3b8", fontSize: 13, fontWeight: 700 }}>1</span>
            </div>
            <div>
              <p style={rb.stepTitle}>What did you love?</p>
              <p style={rb.stepDesc}>
                Pick ONE Service Tag and AT LEAST ONE Category Tag.
              </p>
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Service (Pick exactly 1)</p>
            <div style={rb.tagsGrid}>
              {serviceTags.map((tag) => {
                const selected = selectedServiceTag === tag.id;
                return (
                <button key={tag.id} type="button" onClick={() => toggleServiceTag(tag.id)} style={{
                  padding: "8px 14px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                  border: selected ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                  background: selected ? "#eff6ff" : "white",
                  color: selected ? "#4f46e5" : "#475569",
                  boxShadow: selected ? "0 2px 8px rgba(99,102,241,0.15)" : "none",
                  transform: selected ? "scale(1.02)" : "scale(1)",
                  width: "100%", textAlign: "center",
                }}>
                  {tag.emoji} {tag.label}
                </button>
              );})}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Categories (Pick at least 1)</p>
            <div style={rb.tagsGrid}>
              {categoryTags.map((tag) => {
                const selected = selectedCategoryTags.includes(tag.id);
                const atCap = !selected && selectedCategoryTags.length >= maxTagSelections;
                return (
                <button key={tag.id} type="button" disabled={atCap} onClick={() => toggleCategoryTag(tag.id)} style={{
                  padding: "8px 14px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                  cursor: atCap ? "not-allowed" : "pointer", opacity: atCap ? 0.45 : 1, transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                  border: selected ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                  background: selected ? "#eff6ff" : "white",
                  color: selected ? "#4f46e5" : "#475569",
                  boxShadow: selected ? "0 2px 8px rgba(99,102,241,0.15)" : "none",
                  transform: selected ? "scale(1.02)" : "scale(1)",
                  width: "100%", textAlign: "center",
                }}>
                  {tag.emoji} {tag.label}
                </button>
              );})}
            </div>
          </div>
        </div>

        {/* Step 2 — Write */}
        <div style={{ ...rb.card, border: activeStep === 2 ? "1.5px solid #8b5cf6" : "1.5px solid transparent", boxShadow: activeStep === 2 ? "0 8px 24px rgba(139,92,246,0.12)" : rb.card.boxShadow }}>
          <div style={rb.stepHeader}>
            <div style={{ ...rb.stepBadge, background: activeStep >= 2 ? "#8b5cf6" : "#f1f5f9" }}>
              <span style={{ color: activeStep >= 2 ? "white" : "#94a3b8", fontSize: 13, fontWeight: 700 }}>2</span>
            </div>
            <div>
              <p style={rb.stepTitle}>Write your review</p>
              <p style={rb.stepDesc}>Tap any draft below to copy it here — tweak the wording if you want, then continue to Google.</p>
            </div>
          </div>

          {!readyForReviews ? (
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16, lineHeight: 1.5 }}>
              Your review options will show here once step 1 is done.
            </p>
          ) : (
            <div style={{ position: "relative", marginBottom: 16 }}>
              {/* Slider Viewport */}
              <div style={{ overflow: "hidden", borderRadius: 12, paddingBottom: 4 }}>
                {/* Slider Track */}
                <div
                  style={{
                    display: "flex",
                    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: `translateX(-${activeSlide * 100}%)`,
                  }}
                >
                  {[0, 1, 2].map((slot) => {
                    if (slot === 2 && !showThirdRow) return null;
                    
                    const text = reviewVariants[slot];
                    const isGen = slot === 2 ? generatingThird : generatingPair;
                    const isSel = selectedVariantIndex === slot && !!text;
                    
                    return (
                      <div key={slot} style={{ flex: "0 0 100%", padding: "2px" }}>
                        <button
                          type="button"
                          disabled={isGen || !text}
                          onClick={() => {
                            if (isGen || !text) return;
                            selectVariant(slot, text);
                          }}
                          style={{
                            textAlign: "left",
                            width: "100%",
                            padding: "16px 20px",
                            borderRadius: 12,
                            border: isSel ? "2px solid #8b5cf6" : "1px solid #e2e8f0",
                            background: isSel ? "#faf5ff" : "#fafbff",
                            cursor: isGen || !text ? "default" : "pointer",
                            transition: "all 0.2s",
                            boxShadow: isSel ? "0 4px 16px rgba(139,92,246,0.15)" : "0 2px 6px rgba(0,0,0,0.02)",
                            opacity: (slot === 2 && !hasThirdTag && !isGen) ? 0.95 : 1,
                            minHeight: 140,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
                            Review idea {slot + 1}
                            {isSel ? " — selected" : text ? " — tap to use this one" : ""}
                          </div>
                          
                          {isGen ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#64748b", marginTop: "auto", marginBottom: "auto" }}>
                              <span style={{ width: 18, height: 18, border: "2px solid #cbd5e1", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                              {slot === 2 ? "Writing idea 3 from your picks…" : "Writing your review…"}
                            </div>
                          ) : text ? (
                            <p style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.55, margin: 0 }}>{text}</p>
                          ) : slot === 2 ? (
                            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                              {hasThirdTag
                                ? "Hang tight — idea 3 will show here in a moment."
                                : "Go back to step 1 and choose one more thing you loved — idea 3 will appear here automatically."}
                            </p>
                          ) : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controls */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "0 4px" }}>
                <button
                  onClick={() => { lastManualSlideRef.current = Date.now(); setActiveSlide(s => Math.max(0, s - 1)); }}
                  disabled={activeSlide === 0}
                  style={{
                    background: "none", border: "none", cursor: activeSlide === 0 ? "default" : "pointer",
                    opacity: activeSlide === 0 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 8, color: "#64748b", transition: "opacity 0.2s"
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div style={{ display: "flex", gap: 8 }}>
                  {Array.from({ length: totalSlides }).map((_, i) => (
                    <div
                      key={i}
                      onClick={() => { lastManualSlideRef.current = Date.now(); setActiveSlide(i); }}
                      style={{
                        width: activeSlide === i ? 20 : 8,
                        height: 8,
                        borderRadius: 4,
                        background: activeSlide === i ? "#8b5cf6" : "#e2e8f0",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: "pointer"
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => { lastManualSlideRef.current = Date.now(); setActiveSlide(s => Math.min(totalSlides - 1, s + 1)); }}
                  disabled={activeSlide === totalSlides - 1}
                  style={{
                    background: "none", border: "none", cursor: activeSlide === totalSlides - 1 ? "default" : "pointer",
                    opacity: activeSlide === totalSlides - 1 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 8, color: "#64748b", transition: "opacity 0.2s"
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          <textarea
            value={reviewText}
            onChange={(e) => { setReviewText(e.target.value); setActiveStep(3); }}
            placeholder="Edit your chosen review here, or write from scratch if you prefer."
            rows={5}
            style={{
              width: "100%", resize: "none", borderRadius: 12,
              border: "1px solid #e2e8f0", padding: "14px 16px",
              fontSize: 14, color: "#1e293b", lineHeight: 1.6,
              fontFamily: "inherit", outline: "none", transition: "border-color 0.2s",
              background: "#fafbff",
            }}
            onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
          />
          {reviewText && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{reviewText.length} characters</p>}
        </div>

        {/* Step 3 — Post */}
        <div style={{ ...rb.card, border: activeStep === 3 ? "1.5px solid #ec4899" : "1.5px solid transparent", boxShadow: activeStep === 3 ? "0 8px 24px rgba(236,72,153,0.12)" : rb.card.boxShadow }}>
          <div style={rb.stepHeader}>
            <div style={{ ...rb.stepBadge, background: activeStep >= 3 ? "#ec4899" : "#f1f5f9" }}>
              <span style={{ color: activeStep >= 3 ? "white" : "#94a3b8", fontSize: 13, fontWeight: 700 }}>3</span>
            </div>
            <div>
              <p style={rb.stepTitle}>Post to Google</p>
              <p style={rb.stepDesc}>One tap — your review gets copied then opens Google</p>
            </div>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.5 }}>
              📋 We'll <strong>copy your review</strong> to clipboard, then open Google Reviews. Just <strong>paste & submit!</strong>
            </p>
          </div>

          <button
            onClick={copyAndRedirect}
            disabled={!reviewText.trim() || submitting}
            style={{
              width: "100%", padding: "16px 24px", borderRadius: 12, border: "none",
              background: reviewText.trim() && !submitting
                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)"
                : "#f1f5f9",
              color: reviewText.trim() ? "white" : "#94a3b8",
              fontSize: 15, fontWeight: 700, cursor: !reviewText.trim() ? "not-allowed" : "pointer",
              transition: "all 0.3s", letterSpacing: "0.02em",
              boxShadow: reviewText.trim() ? "0 8px 32px rgba(99,102,241,0.4)" : "none",
              transform: reviewText.trim() && !submitting ? "translateY(-1px)" : "none",
            }}
          >
            {submitting ? "✓ Copied! Opening Google..." : "Copy & Open Google Review →"}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system,'SF Pro Display',BlinkMacSystemFont,'Segoe UI',sans-serif; }
        textarea::placeholder { color: #cbd5e1; }
      `}</style>
    </main>
  );
}

const rb: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh", padding: "32px 16px",
    background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #faf8ff 100%)",
    position: "relative", overflow: "hidden",
  },
  bg1: {
    position: "fixed", top: "-15%", right: "-10%", width: 500, height: 500,
    borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bg2: {
    position: "fixed", bottom: "-20%", left: "-10%", width: 600, height: 600,
    borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: { maxWidth: 520, margin: "0 auto", position: "relative", zIndex: 1 },
  header: { textAlign: "center", marginBottom: 28 },
  starsRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#64748b" },
  card: {
    background: "#ffffff",
    borderRadius: 16, padding: "22px 24px", marginBottom: 16,
    boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
    transition: "all 0.3s ease",
  },
  stepHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 18 },
  stepBadge: {
    width: 28, height: 28, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background 0.3s",
  },
  stepTitle: { fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 2 },
  stepDesc: { fontSize: 12, color: "#94a3b8" },
  tagsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 },
};

export default function ReviewBuilderPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8faff" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </main>
    }>
      <ReviewBuilderContent />
    </Suspense>
  );
}

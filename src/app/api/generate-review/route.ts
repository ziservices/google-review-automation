import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    rating,
    // New structured fields
    serviceTag,
    categoryTags: categoryTagsRaw = [],
    // Legacy flat tags fallback
    tags = [],
    tone = "friendly",
    variantHint,
  } = body;

  // Support both new structured payload and legacy flat tags array
  const service: string = serviceTag ?? (Array.isArray(tags) ? tags[0] : null) ?? "service";
  const categories: string[] = Array.isArray(categoryTagsRaw)
    ? categoryTagsRaw
    : Array.isArray(tags)
    ? tags.slice(1)
    : [];

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const openai = new OpenAI({ apiKey });

    if (!rating) {
      return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    }

    const toneMap: Record<string, string> = {
      friendly: "warm and friendly",
      formal: "professional and formal",
      casual: "casual and conversational",
    };

    const variation =
      typeof variantHint === "string" && variantHint.trim()
        ? `\nStructure: ${variantHint.trim()}`
        : "";

    // Build natural context: service is WHAT they used, categories describe HOW it felt
    const categoryPhrase =
      categories.length > 0
        ? `The customer felt the experience was: ${categories.join(", ")}.`
        : "";

    const prompt = `Write a short, genuine Google review for a business that received a ${rating}-star rating.

The customer used this service: "${service}". Write the review ABOUT this service — it is the main subject.
${categoryPhrase ? `${categoryPhrase} Weave these qualities naturally into how you describe the ${service} experience. Do NOT list them as separate items.` : ""}

Tone: ${toneMap[tone] ?? "warm and friendly"}.
${variation}

Requirements:
- 2-4 sentences maximum
- Sound like a real customer wrote it, not AI-generated
- The service ("${service}") must be the clear subject of the review
- Category qualities (${categories.join(", ") || "none"}) should describe the experience, not be listed as nouns
  WRONG: "The SEO Optimization and the Reliable Support were great"
  RIGHT: "Their SEO Optimization work was reliable and the support throughout was excellent"
- Do NOT use words like "exceptional", "impeccable", "delightful", "seamless", "top-notch", "outstanding"
- Use a unique opening, not "I" or "Really happy with"
- If rating is 4 stars, be positive but measured. If 5 stars, be enthusiastic but authentic.
- Do NOT use em dashes (—) or en dashes (–). Use a period or comma instead.
- Output ONLY the review text, no quotes, no preamble`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.95,
    });

    const review = (completion.choices[0]?.message?.content?.trim() ?? "")
      .replace(/\s*[—–]\s*/g, ". ")
      .replace(/\.\s*\./g, ".")
      .trim();

    return NextResponse.json({ review });
  } catch (error) {
    console.error("OpenAI error:", error);

    // Fallbacks that use service as subject and categories as descriptors
    const catPhrase =
      categories.length > 0
        ? `, with ${categories.join(" and ")} throughout`
        : "";

    const fallbacks: Record<string, string> = {
      friendly: `The ${service} here was solid${catPhrase}. The team clearly knows what they are doing and it shows. Would come back without hesitation.`,
      casual: `Went in for ${service} and came out impressed${catPhrase}. Exactly what I was looking for, no complaints at all.`,
      formal: `The ${service} was handled professionally${catPhrase}. Everything was well-managed and the results spoke for themselves. Would recommend.`,
    };

    const review = fallbacks[tone] ?? fallbacks.friendly;
    return NextResponse.json({ review });
  }
}

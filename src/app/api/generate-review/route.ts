import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// ── Persona pool — different customer archetypes ─────────────────────────────
const PERSONAS = [
  "a busy professional who values efficiency and results",
  "a first-time customer who was pleasantly surprised",
  "a long-time loyal customer recommending to others",
  "a skeptical customer who was won over",
  "a detail-oriented person who noticed the small things",
  "someone who compared this to competitors and chose this",
  "a customer who came back after a great first experience",
  "someone who was referred by a friend and wasn't disappointed",
  "a customer who had a specific problem that got solved",
  "someone who appreciates good value for money",
];

// ── Opening styles — forces structural variety ────────────────────────────────
const OPENING_STYLES = [
  "Start with a specific outcome or result you got from the service.",
  "Start with what made you choose this business over others.",
  "Start with how the experience compared to your expectations.",
  "Start with a specific moment or detail that stood out.",
  "Start with the problem you came in with and how it was resolved.",
  "Start with how you felt after the experience was done.",
  "Start with a recommendation to a specific type of person.",
  "Start with what you noticed immediately when you engaged with the service.",
  "Start with the thing you will remember most about this experience.",
  "Start with what surprised you most, positively.",
];

// ── Banned openers — prevent repetitive starts ────────────────────────────────
const BANNED_OPENERS = [
  "I ", "Really happy", "Very happy", "So happy", "Great experience",
  "Amazing experience", "Excellent service", "Highly recommend",
  "5 stars", "Five stars", "Would recommend", "The team",
  "The staff", "The service was", "This place", "Went here",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    rating,
    serviceTag,
    categoryTags: categoryTagsRaw = [],
    tags = [],
    tone = "friendly",
    variantHint,
  } = body;

  const service: string = (
    typeof serviceTag === "string" ? serviceTag.trim().slice(0, 60) :
    Array.isArray(tags) && typeof tags[0] === "string" ? tags[0].trim().slice(0, 60) : "service"
  ) || "service";

  const categories: string[] = (
    Array.isArray(categoryTagsRaw) ? categoryTagsRaw :
    Array.isArray(tags) ? tags.slice(1) : []
  )
    .filter((t): t is string => typeof t === "string")
    .map(t => t.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 10);

  // Pick random persona and opening style for this request
  const persona = pick(PERSONAS);
  const openingStyle = pick(OPENING_STYLES);
  const bannedList = BANNED_OPENERS.join('", "');

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const openai = new OpenAI({ apiKey });

    if (!rating) {
      return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    }

    const toneMap: Record<string, string> = {
      friendly: "warm and personal",
      formal: "professional and measured",
      casual: "relaxed and conversational, like texting a friend",
    };

    const structureHint =
      typeof variantHint === "string" && variantHint.trim()
        ? variantHint.trim()
        : openingStyle;

    const categoryPhrase =
      categories.length > 0
        ? `The customer experienced these qualities: ${categories.join(", ")}. Weave them naturally as descriptors of the ${service} experience — never list them as separate nouns.`
        : "";

    const prompt = `You are writing a genuine Google review. Every review you write must be completely unique — different wording, different structure, different angle — even for the same business and tags.

CUSTOMER PERSONA: Write as ${persona}.
SERVICE REVIEWED: "${service}" — this is the main subject of the review.
${categoryPhrase}
STAR RATING: ${rating} out of 5.
TONE: ${toneMap[tone] ?? "warm and personal"}.
STRUCTURE: ${structureHint}

STRICT RULES:
1. 2-4 sentences only. No more.
2. Sound like a real human wrote this — varied sentence length, natural phrasing.
3. NEVER start with any of these: "${bannedList}".
4. NEVER use: "exceptional", "impeccable", "delightful", "seamless", "top-notch", "outstanding", "fantastic", "amazing", "incredible", "wonderful".
5. NEVER use em dashes (—) or en dashes (–). Use a period or comma instead.
6. The service "${service}" must be the clear subject — not buried or listed alongside category words.
7. Category qualities describe HOW the service felt, not separate things to praise.
8. Each review must have a DIFFERENT opening word and sentence structure from any typical review.
9. If 4 stars: positive but honest, not gushing. If 5 stars: enthusiastic but grounded.
10. Output ONLY the review text. No quotes, no labels, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You write unique, human-sounding Google reviews. You never repeat sentence structures or openings. Every review you produce is distinctly different from the last.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 160,
      temperature: 1.1,        // Higher than before for more variety
      presence_penalty: 0.6,   // Penalises reusing the same phrases
      frequency_penalty: 0.5,  // Penalises repeating words within the review
    });

    const review = (completion.choices[0]?.message?.content?.trim() ?? "")
      .replace(/\s*[—–]\s*/g, ". ")
      .replace(/\.\s*\./g, ".")
      .replace(/^["']|["']$/g, "") // strip any surrounding quotes the model adds
      .trim();

    return NextResponse.json({ review });
  } catch (error) {
    console.error("OpenAI error:", error);

    // Diverse fallbacks — 9 options so repeated calls get different text
    const catDesc = categories.length > 0 ? ` with ${categories.join(" and ")}` : "";
    const fallbacks = [
      `Came for the ${service} and left genuinely impressed${catDesc}. Exactly what I needed, handled well from start to finish.`,
      `The ${service} delivered${catDesc}. No fuss, no delays, just solid work that did what it was supposed to.`,
      `Needed ${service} done properly and that is exactly what happened${catDesc}. Worth every penny and would use again.`,
      `Not my first time using ${service} providers but this one stood out${catDesc}. The difference was noticeable.`,
      `Booked for ${service} after a recommendation and the recommendation was spot on${catDesc}. Very satisfied.`,
      `The ${service} here is the real deal${catDesc}. Straightforward process, good communication, great result.`,
      `Walked away from the ${service} experience genuinely happy${catDesc}. That does not always happen, so worth noting.`,
      `Solid ${service}${catDesc}. The team knew what they were doing and it showed in the final result.`,
      `If you need ${service}, this is the place${catDesc}. Handled professionally and the quality speaks for itself.`,
    ];

    const review = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return NextResponse.json({ review });
  }
}

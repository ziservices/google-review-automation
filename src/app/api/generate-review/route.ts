import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { rating, tags, tone = "friendly", variantHint } = await req.json();

    if (!rating) {
      return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    }

    const tagContext = tags?.length > 0
      ? `The customer particularly appreciated: ${tags.join(", ")}.`
      : "";

    const toneMap: Record<string, string> = {
      friendly: "warm and friendly",
      formal: "professional and formal",
      casual: "casual and conversational",
    };

    const variation =
      typeof variantHint === "string" && variantHint.trim()
        ? `\nWrite this as a clearly different wording from any other review about the same visit (different opening, sentence structure, and emphasis). Hint: ${variantHint.trim()}`
        : "";

    const prompt = `Write a short, genuine Google review for a restaurant/bar that received a ${rating}-star rating. 
${tagContext}
Tone: ${toneMap[tone] ?? "warm and friendly"}.
${variation}
Requirements:
- 2-4 sentences maximum
- Sound like a real customer wrote it (not AI)
- Do NOT use words like "exceptional", "impeccable", "delightful", "seamless"
- Be specific based on the tags if provided
- If rating is 4 stars, be positive but not over the top
- If rating is 5 stars, be enthusiastic but still authentic
- Output ONLY the review text, no quotes, no preamble`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    });

    const review = completion.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ review });
  } catch (error) {
    console.error("OpenAI error:", error);
    // Fallback review if OpenAI fails
    const fallbacks = [
      "Really enjoyed our visit here. The food was great and the staff were super friendly. Definitely coming back!",
      "Had a great time at this place. Everything was just as expected — good food, good service, good vibes.",
      "Solid spot for a meal out. Food came quickly, tasted fresh, and the team was welcoming. Would recommend.",
    ];
    const review = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return NextResponse.json({ review });
  }
}
/**
 * app/api/review/[slug]/tags/route.ts
 *
 * Public endpoint — no auth needed.
 * Called by the review page to get custom tags for a business.
 * Falls back to DEFAULT_TAGS if the business has none set.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const DEFAULT_TAGS = [
  { id: "d1", emoji: "😊", label: "Friendly Staff" },
  { id: "d2", emoji: "✨", label: "Clean & Tidy" },
  { id: "d3", emoji: "⚡", label: "Fast Service" },
  { id: "d4", emoji: "💰", label: "Great Value" },
  { id: "d5", emoji: "🏆", label: "Professional" },
  { id: "d6", emoji: "❤️", label: "Caring" },
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { slug } = await params;

  const { data, error } = await supabase
    .from("businesses")
    .select("custom_tags")
    .eq("custom_url_slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ tags: DEFAULT_TAGS });
  }

  const tags = data.custom_tags?.tags;
  return NextResponse.json({
    tags: Array.isArray(tags) && tags.length > 0 ? tags : DEFAULT_TAGS,
  });
}
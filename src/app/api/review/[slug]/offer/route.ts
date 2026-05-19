/**
 * /api/review/[slug]/offer
 *
 * Public endpoint — no auth needed.
 * Returns ONE randomly selected offer from the business's offers array.
 * Called by the thank-you page after a 5-star review.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data, error } = await supabase
    .from("businesses")
    .select("custom_tags")
    .eq("custom_url_slug", slug)
    .single();

  if (error || !data?.custom_tags) {
    return NextResponse.json({ offer: null });
  }

  const ct = data.custom_tags;

  // Support both new `offers[]` array and legacy single `offer`
  let offers: unknown[] = [];
  if (Array.isArray(ct.offers) && ct.offers.length > 0) {
    offers = ct.offers;
  } else if (ct.offer?.title) {
    offers = [ct.offer];
  }

  if (offers.length === 0) return NextResponse.json({ offer: null });

  // Pick one at random
  const offer = offers[Math.floor(Math.random() * offers.length)];
  return NextResponse.json({ offer });
}

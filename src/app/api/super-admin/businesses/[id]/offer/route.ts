/**
 * /api/super-admin/businesses/[id]/offer
 *
 * GET    → fetch all reward offers for a business  → { offers: Offer[] }
 * PUT    → save/replace the full offers array      → { ok, offers }
 * DELETE → remove one offer by index               → body: { index: number }
 *
 * Stored inside the existing `custom_tags` JSONB column:
 *   custom_tags: { serviceTags, categoryTags, offers: Offer[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { superAdminGuard } from "@/lib/super-admin-auth";

type OfferInput = {
  title?: unknown;
  description?: unknown;
  code?: unknown;
  expiry?: unknown;
  emoji?: unknown;
};

function sanitizeOffer(o: OfferInput) {
  return {
    title: String(o.title ?? "").trim().slice(0, 80),
    description: String(o.description ?? "").trim().slice(0, 200),
    code: String(o.code ?? "").trim().slice(0, 40),
    expiry: String(o.expiry ?? "").trim().slice(0, 30),
    emoji: String(o.emoji ?? "🎁").slice(0, 4),
  };
}

async function getExisting(id: string) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("businesses")
    .select("custom_tags")
    .eq("id", id)
    .single();
  return data?.custom_tags ?? {};
}

// ── GET ────────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = superAdminGuard(req);
  if (denied) return denied;

  const { id } = await params;
  const existing = await getExisting(id);

  // Support both old single `offer` and new `offers` array
  let offers = existing.offers ?? null;
  if (!offers && existing.offer) offers = [existing.offer];
  offers = Array.isArray(offers) ? offers : [];

  return NextResponse.json({ offers });
}

// ── PUT: replace full offers array ────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = superAdminGuard(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body missing" }, { status: 400 });

  const rawOffers: OfferInput[] = Array.isArray(body.offers) ? body.offers : [];
  const offers = rawOffers
    .map(sanitizeOffer)
    .filter(o => o.title.length > 0);

  const admin = getSupabaseAdmin();
  const existing = await getExisting(id);
  const merged = { ...existing, offers, offer: null }; // clear legacy single offer

  const { error } = await admin
    .from("businesses")
    .update({ custom_tags: merged })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, offers });
}

// ── DELETE: remove one offer by index ─────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = superAdminGuard(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const index = typeof body.index === "number" ? body.index : -1;

  const admin = getSupabaseAdmin();
  const existing = await getExisting(id);

  let offers: ReturnType<typeof sanitizeOffer>[] = Array.isArray(existing.offers)
    ? existing.offers
    : existing.offer
    ? [existing.offer]
    : [];

  if (index >= 0 && index < offers.length) {
    offers = offers.filter((_, i) => i !== index);
  }

  const merged = { ...existing, offers, offer: null };

  const { error } = await admin
    .from("businesses")
    .update({ custom_tags: merged })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, offers });
}

/**
 * /api/super-admin/businesses/[id]/tags/route.ts
 *
 * GET  → fetch custom tags for a business
 * PUT  → save/replace custom tags for a business
 *
 * Requires: Authorization: Bearer <REVIEWFLOW_SUPER_ADMIN_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { superAdminGuard } from "@/lib/super-admin-auth";

// ── GET: fetch tags for a business ─────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = superAdminGuard(req);
  if (denied) return denied;

  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("businesses")
    .select("custom_tags")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.custom_tags) return NextResponse.json({ tags: null }, { status: 404 });

  return NextResponse.json(data.custom_tags);
}

// ── PUT: save tags for a business ──────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = superAdminGuard(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body missing" }, { status: 400 });

  const sanitizeTags = (arr: unknown[]) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((t): t is Record<string, unknown> => typeof t === "object" && t !== null)
      .filter((t) => typeof t.label === "string" && String(t.label).trim())
      .map((t) => ({
        id: typeof t.id === "string" ? t.id : Math.random().toString(36).slice(2),
        label: String(t.label).trim().slice(0, 60),
        emoji: String(t.emoji ?? "⭐").slice(0, 4),
      }));
  };

  const serviceTags = sanitizeTags(body.serviceTags ?? body.tags ?? []);
  const categoryTags = sanitizeTags(body.categoryTags ?? []);

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("businesses")
    .update({ custom_tags: { serviceTags, categoryTags } })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, serviceTags, categoryTags });
}

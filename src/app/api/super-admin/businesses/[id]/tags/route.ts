/**
 * /api/super-admin/businesses/[id]/tags/route.ts
 *
 * GET  → fetch custom tags for a business
 * PUT  → save/replace custom tags for a business
 *
 * Requires: Authorization: Bearer <REVIEWFLOW_SUPER_ADMIN_SECRET>
 *
 * DB schema expected (add to your businesses table or create a separate table):
 *
 *   ALTER TABLE businesses
 *     ADD COLUMN IF NOT EXISTS custom_tags jsonb DEFAULT NULL;
 *
 * Tag shape stored in custom_tags:
 *   { serviceTags: Array<{...}>, categoryTags: Array<{...}> }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SECRET = process.env.REVIEWFLOW_SUPER_ADMIN_SECRET ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return token === SECRET && SECRET.length > 0;
}

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

// ── GET: fetch tags for a business ─────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) return unauthorized();
  const { id } = await params;

  const supabase = adminClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("custom_tags")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.custom_tags) {
    // No custom tags — signal the client to fall back to default template
    return NextResponse.json({ tags: null }, { status: 404 });
  }

  return NextResponse.json(data.custom_tags);
}

// ── PUT: save tags for a business ──────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) return unauthorized();
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body missing" }, { status: 400 });
  }

  const sanitizeTags = (arr: any[]) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((t) => typeof t.label === "string" && t.label.trim())
      .map((t) => ({
        id: t.id ?? Math.random().toString(36).slice(2),
        label: String(t.label).trim().slice(0, 60),
        emoji: String(t.emoji ?? "⭐").slice(0, 4),
      }));
  };

  const serviceTags = sanitizeTags(body.serviceTags || body.tags || []);
  const categoryTags = sanitizeTags(body.categoryTags || []);

  const supabase = adminClient();
  const { error } = await supabase
    .from("businesses")
    .update({ custom_tags: { serviceTags, categoryTags } })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, serviceTags, categoryTags });
}
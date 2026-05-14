import { NextRequest, NextResponse } from "next/server";
import { slugify } from "@/lib/analytics";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { superAdminGuard } from "@/lib/super-admin-auth";

export async function GET(req: NextRequest) {
  const denied = superAdminGuard(req);
  if (denied) return denied;
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("businesses")
      .select("id, name, custom_url_slug, place_id, logo_url, is_active, plan, owner_email, created_at")
      .order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ businesses: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const denied = superAdminGuard(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const place_id = String(body.place_id ?? "").trim();
    if (!place_id) return NextResponse.json({ error: "place_id is required" }, { status: 400 });

    let slug = String(body.custom_url_slug ?? "").trim();
    slug = slug ? slugify(slug) : slugify(name);
    if (!slug) return NextResponse.json({ error: "custom_url_slug is invalid" }, { status: 400 });

    const owner_email = body.owner_email ? String(body.owner_email).trim().toLowerCase() : null;
    const plan = ["basic", "pro", "enterprise"].includes(String(body.plan))
      ? String(body.plan)
      : "basic";

    const admin = getSupabaseAdmin();
    const row: Record<string, unknown> = {
      name,
      custom_url_slug: slug,
      place_id,
      logo_url: body.logo_url ? String(body.logo_url).trim() || null : null,
      owner_email,
      plan,
      is_active: body.is_active !== false,
    };

    if (body.email !== undefined) row.email = String(body.email ?? "").trim() || null;
    if (body.phone !== undefined) row.phone = String(body.phone ?? "").trim() || null;
    if (body.description !== undefined) row.description = String(body.description ?? "").trim() || null;
    if (row.email === undefined && owner_email) row.email = owner_email;
    if (row.email === undefined) row.email = `${slug}@clients.reviewflow.local`;

    const { data, error } = await admin.from("businesses").insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ business: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

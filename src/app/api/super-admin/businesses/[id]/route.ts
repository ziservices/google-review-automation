import { NextRequest, NextResponse } from "next/server";
import { slugify } from "@/lib/analytics";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { superAdminGuard } from "@/lib/super-admin-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const denied = superAdminGuard(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.place_id === "string") patch.place_id = body.place_id.trim();
  if (body.logo_url === null) patch.logo_url = null;
  else if (typeof body.logo_url === "string") patch.logo_url = body.logo_url.trim() || null;
  if (body.owner_email === null) patch.owner_email = null;
  else if (typeof body.owner_email === "string") patch.owner_email = body.owner_email.trim().toLowerCase() || null;
  if (typeof body.plan === "string" && ["basic", "pro", "enterprise"].includes(body.plan)) patch.plan = body.plan;
  if (typeof body.custom_url_slug === "string") {
    const s = slugify(body.custom_url_slug);
    if (!s) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    patch.custom_url_slug = s;
  }
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (typeof body.email === "string") patch.email = body.email.trim() || null;
  if (typeof body.phone === "string") patch.phone = body.phone.trim() || null;
  if (typeof body.description === "string") patch.description = body.description.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("businesses").update(patch).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ business: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const denied = superAdminGuard(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("businesses").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Delete failed" }, { status: 500 });
  }
}

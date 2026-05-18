import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { superAdminGuard } from "@/lib/super-admin-auth";

export async function GET(req: NextRequest) {
  const denied = superAdminGuard(req);
  if (denied) return denied;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("businesses")
    .select("custom_tags")
    .eq("custom_url_slug", "system-default-tags")
    .single();

  if (error || !data?.custom_tags) {
    return NextResponse.json({ tags: [] });
  }

  return NextResponse.json(data.custom_tags);
}

export async function PUT(req: NextRequest) {
  const denied = superAdminGuard(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.tags)) {
    return NextResponse.json(
      { error: "Body must be { tags: ServiceTag[] }" },
      { status: 400 }
    );
  }

  const tags = body.tags.map((t: any) => ({
    id: t.id || Math.random().toString(36).slice(2),
    label: String(t.label || "").trim().slice(0, 60),
    emoji: String(t.emoji || "⭐").slice(0, 4),
  }));

  const admin = getSupabaseAdmin();
  
  // Try to update first
  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("custom_url_slug", "system-default-tags")
    .single();

  if (existing) {
    const { error } = await admin
      .from("businesses")
      .update({ custom_tags: { tags } })
      .eq("id", existing.id);
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Insert if it doesn't exist
    const { error } = await admin
      .from("businesses")
      .insert({
        name: "System Default Tags",
        custom_url_slug: "system-default-tags",
        place_id: "system",
        custom_tags: { tags },
        is_active: false
      });
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tags });
}

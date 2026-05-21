/**
 * /api/review/[slug]/info
 * Public endpoint — returns basic business info for the review page.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("businesses")
    .select("id, name, place_id, custom_url_slug, logo_url, is_active, plan")
    .eq("custom_url_slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ business: null }, { status: 404 });
  }

  return NextResponse.json({ business: data });
}

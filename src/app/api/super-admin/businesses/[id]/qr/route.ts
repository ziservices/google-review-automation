import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { superAdminGuard } from "@/lib/super-admin-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const denied = superAdminGuard(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const format = new URL(req.url).searchParams.get("format") === "svg" ? "svg" : "png";

  try {
    const admin = getSupabaseAdmin();
    const { data: b, error } = await admin.from("businesses").select("custom_url_slug, name").eq("id", id).single();
    if (error || !b) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const fallbackOrigin = new URL(req.url).origin;
    const origin = configured || fallbackOrigin;
    const targetUrl = `${origin}/review/${encodeURIComponent(b.custom_url_slug)}`;

    const safeName = String(b.custom_url_slug).replace(/[^a-z0-9-_]/gi, "-");

    if (format === "svg") {
      const svg = await QRCode.toString(targetUrl, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="reviewflow-qr-${safeName}.svg"`,
        },
      });
    }

    const buf = await QRCode.toBuffer(targetUrl, {
      type: "png",
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
    });
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="reviewflow-qr-${safeName}.png"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "QR failed" }, { status: 500 });
  }
}

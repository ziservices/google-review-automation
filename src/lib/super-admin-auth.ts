import { NextRequest, NextResponse } from "next/server";

export function validateSuperAdminRequest(req: NextRequest): boolean {
  const expected = process.env.REVIEWFLOW_SUPER_ADMIN_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const header = req.headers.get("x-reviewflow-super-admin-secret");
  const provided = bearer || header;
  return !!provided && provided === expected;
}

export function superAdminGuard(req: NextRequest): NextResponse | null {
  if (!process.env.REVIEWFLOW_SUPER_ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Server missing REVIEWFLOW_SUPER_ADMIN_SECRET" },
      { status: 503 },
    );
  }
  if (!validateSuperAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

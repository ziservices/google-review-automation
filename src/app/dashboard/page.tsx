import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdmin();
  const { data: business, error } = await admin
    .from("businesses")
    .select("*")
    .eq("owner_email", user.email?.toLowerCase())
    .maybeSingle();

  if (!business || error) {
    return (
      <main style={{ minHeight: "100vh", background: "#F7F7F7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1C1C1C", marginBottom: 8 }}>No business found</h1>
          <p style={{ color: "#A0A0A0", fontSize: 14 }}>Logged in as: {user.email}</p>
        </div>
      </main>
    );
  }

  // Pass only the business info — DashboardClient fetches live stats itself
  return (
    <DashboardClient
      business={business}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
    />
  );
}

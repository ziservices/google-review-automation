"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AnalyticsStats } from "@/lib/analytics";
import { AnalyticsBoard } from "@/components/AnalyticsBoard";

type Business = { id: string; name: string; custom_url_slug: string; plan: string };

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return createBrowserClient(url, anon);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { session } } = await supabase().auth.getSession();
    if (!session) {
      router.replace("/login");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/dashboard/stats", { credentials: "include" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Could not load dashboard");
      setStats(null);
      setBusiness(null);
      setLoading(false);
      return;
    }
    setBusiness(json.business as Business);
    setStats(json.stats as AnalyticsStats);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function signOut() {
    await supabase().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
      </div>
    );
  }

  if (error || !stats || !business) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">Dashboard unavailable</p>
          <p className="mt-2">{error ?? "Unknown error"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white"
              onClick={() => void load()}
            >
              Retry
            </button>
            <Link href="/login" className="rounded-lg border border-amber-900/30 px-3 py-1.5 text-xs font-semibold">
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AnalyticsBoard
      title="Your analytics"
      subtitle={`${business.name} · plan: ${business.plan}`}
      stats={stats}
      nav={
        <>
          <Link
            href={`/review/${business.custom_url_slug}`}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            Open review page
          </Link>
          <Link
            href="/super-admin"
            className="rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            Super Admin
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </>
      }
    />
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AnalyticsStats } from "@/lib/analytics";
import { AnalyticsBoard } from "@/components/AnalyticsBoard";

const SECRET_KEY = "rf_super_admin_secret";

type Business = { id: string; name: string; custom_url_slug: string; plan: string; is_active?: boolean };

export default function AdminBusinessAnalyticsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    const secret = typeof window !== "undefined" ? sessionStorage.getItem(SECRET_KEY) : null;
    const headers: Record<string, string> = {};
    if (secret) headers.Authorization = `Bearer ${secret}`;
    const res = await fetch(`/api/admin/businesses/${businessId}/stats`, {
      headers,
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        typeof json.error === "string"
          ? json.error
          : res.status === 403
            ? "Forbidden — sign in as the business owner, or open Super Admin and save your admin secret in this browser."
            : "Failed to load",
      );
      setStats(null);
      setBusiness(null);
      setLoading(false);
      return;
    }
    setBusiness(json.business as Business);
    setStats(json.stats as AnalyticsStats);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

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
        <div className="max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-950">
          <p className="font-semibold">Could not load analytics</p>
          <p className="mt-2">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/super-admin"
              className="rounded-lg bg-red-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
            >
              Super Admin
            </Link>
            <Link href="/login" className="rounded-lg border border-red-900/30 px-3 py-1.5 text-xs font-semibold">
              Owner login
            </Link>
            <button
              type="button"
              className="rounded-lg border border-red-900/30 px-3 py-1.5 text-xs font-semibold"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AnalyticsBoard
      title={business.name}
      subtitle={`Per-business analytics · ${business.custom_url_slug} · plan ${business.plan}`}
      stats={stats}
      nav={
        <>
          <Link
            href="/super-admin"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            Super Admin
          </Link>
          <Link
            href={`/review/${business.custom_url_slug}`}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            Review page
          </Link>
        </>
      }
    />
  );
}

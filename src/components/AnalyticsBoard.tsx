"use client";

import type { AnalyticsStats } from "@/lib/analytics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AnalyticsBoard({
  title,
  subtitle,
  stats,
  nav,
}: {
  title: string;
  subtitle?: string;
  stats: AnalyticsStats;
  nav?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
          </div>
          {nav ? <div className="flex flex-wrap gap-2">{nav}</div> : null}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total scans", value: stats.totalScans, icon: "📱" },
            { label: "Ratings collected", value: stats.totalRatings, icon: "⭐" },
            { label: "Google redirects", value: stats.googleRedirects, icon: "🔗" },
            { label: "Conversion rate", value: `${stats.conversionRate}%`, icon: "📈" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-2 text-2xl">{icon}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="mt-1 text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Average rating</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">{stats.avgRating}</span>
              <span className="text-xl text-yellow-400">★</span>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={i < Math.round(stats.avgRating) ? "#FACC15" : "none"}
                stroke={i < Math.round(stats.avgRating) ? "#FACC15" : "#E5E7EB"}
                strokeWidth="1.5"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">QR scans — last 7 days</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.dailyScans}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Line type="monotone" dataKey="scans" stroke="#111827" strokeWidth={2} dot={{ r: 3, fill: "#111827" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Rating breakdown</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.ratingBreakdown} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Bar dataKey="count" fill="#111827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Weekly scans (rolling)</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.weeklyScans} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Bar dataKey="scans" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Monthly scans</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.monthlyScans}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Line type="monotone" dataKey="scans" stroke="#0d9488" strokeWidth={2} dot={{ r: 3, fill: "#0d9488" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Device breakdown</p>
            {stats.deviceBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400">No scan data yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.deviceBreakdown.map((d) => (
                  <li key={d.label} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600">{d.label}</span>
                    <span className="font-semibold text-gray-900">{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Top tags (Google path)</p>
            {stats.topTags.length === 0 ? (
              <p className="text-sm text-gray-400">No tag data yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topTags.map((t) => (
                  <li key={t.tag} className="flex items-start justify-between gap-2 text-sm">
                    <span className="min-w-0 flex-1 text-gray-700">{t.tag}</span>
                    <span className="shrink-0 font-semibold text-gray-900">{t.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {stats.recentFeedback.length > 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Recent private feedback</p>
            <div className="space-y-3">
              {stats.recentFeedback.map((fb) => (
                <div key={fb.id} className="flex items-start gap-3 border-b border-gray-50 py-3 last:border-0">
                  <div className="mt-0.5 flex shrink-0 gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg
                        key={i}
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill={i < fb.rating ? "#FACC15" : "none"}
                        stroke={i < fb.rating ? "#FACC15" : "#E5E7EB"}
                        strokeWidth="2"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">{fb.feedback_text || "No text provided"}</p>
                    <p className="mt-0.5 text-xs text-gray-300">
                      {new Date(fb.created_at).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

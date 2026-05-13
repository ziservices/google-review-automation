"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

interface Stats {
  totalScans: number;
  totalRatings: number;
  googleRedirects: number;
  privateFeedbacks: number;
  avgRating: number;
  ratingBreakdown: { rating: number; count: number; label: string }[];
  dailyScans: { date: string; scans: number }[];
  recentFeedback: { id: string; rating: number; feedback_text: string; created_at: string }[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [scansRes, reviewsRes, feedbackRes] = await Promise.all([
        supabase.from("scan_logs").select("created_at, device_type"),
        supabase.from("reviews_flow").select("rating, submitted_to_google, created_at"),
        supabase.from("feedback").select("id, rating, feedback_text, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const scans = scansRes.data ?? [];
      const reviews = reviewsRes.data ?? [];
      const feedbacks = feedbackRes.data ?? [];

      const totalScans = scans.length;
      const totalRatings = reviews.length;
      const googleRedirects = reviews.filter((r) => r.submitted_to_google).length;
      const privateFeedbacks = feedbacks.length;
      const avgRating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

      // Rating breakdown
      const ratingBreakdown = [1, 2, 3, 4, 5].map((r) => ({
        rating: r,
        label: `${r}★`,
        count: reviews.filter((rv) => rv.rating === r).length,
      }));

      // Daily scans (last 7 days)
      const today = new Date();
      const dailyScans = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        return {
          date: d.toLocaleDateString("en", { weekday: "short" }),
          scans: scans.filter((s) => s.created_at?.startsWith(dateStr)).length,
        };
      });

      setStats({
        totalScans, totalRatings, googleRedirects, privateFeedbacks, avgRating,
        ratingBreakdown, dailyScans, recentFeedback: feedbacks,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </main>
    );
  }

  if (!stats) return null;

  const conversionRate = stats.totalScans > 0
    ? Math.round((stats.googleRedirects / stats.totalScans) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">ReviewFlow — overview of your review funnel</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total scans", value: stats.totalScans, icon: "📱" },
            { label: "Ratings collected", value: stats.totalRatings, icon: "⭐" },
            { label: "Google redirects", value: stats.googleRedirects, icon: "🔗" },
            { label: "Conversion rate", value: `${conversionRate}%`, icon: "📈" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-2xl mb-2">{icon}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Average rating */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Average rating</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">{stats.avgRating}</span>
              <span className="text-yellow-400 text-xl">★</span>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <svg key={i} width="20" height="20" viewBox="0 0 24 24"
                fill={i < Math.round(stats.avgRating) ? "#FACC15" : "none"}
                stroke={i < Math.round(stats.avgRating) ? "#FACC15" : "#E5E7EB"}
                strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Daily scans chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">QR scans — last 7 days</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={stats.dailyScans}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Line type="monotone" dataKey="scans" stroke="#111827" strokeWidth={2} dot={{ r: 3, fill: "#111827" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Rating breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Rating breakdown</p>
            <ResponsiveContainer width="100%" height={160}>
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

        {/* Recent feedback */}
        {stats.recentFeedback.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent private feedback</p>
            <div className="space-y-3">
              {stats.recentFeedback.map((fb) => (
                <div key={fb.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex gap-0.5 mt-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 24 24"
                        fill={i < fb.rating ? "#FACC15" : "none"}
                        stroke={i < fb.rating ? "#FACC15" : "#E5E7EB"}
                        strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{fb.feedback_text || "No text provided"}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(fb.created_at).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
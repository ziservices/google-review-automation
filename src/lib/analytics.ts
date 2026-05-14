export type RawScan = { created_at: string | null; device_type: string | null };
export type RawReview = {
  rating: number;
  submitted_to_google: boolean;
  created_at: string | null;
  selected_tags?: unknown;
};
export type RawFeedback = { id: string; rating: number; feedback_text: string; created_at: string };

export type AnalyticsStats = {
  totalScans: number;
  totalRatings: number;
  googleRedirects: number;
  privateFeedbacks: number;
  avgRating: number;
  conversionRate: number;
  ratingBreakdown: { rating: number; count: number; label: string }[];
  dailyScans: { date: string; scans: number }[];
  weeklyScans: { label: string; scans: number }[];
  monthlyScans: { label: string; scans: number }[];
  deviceBreakdown: { label: string; count: number }[];
  topTags: { tag: string; count: number }[];
  recentFeedback: RawFeedback[];
};

function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  }
  return [];
}

export function aggregateAnalytics(
  scans: RawScan[],
  reviews: RawReview[],
  feedbacks: RawFeedback[],
  opts?: { recentFeedbackLimit?: number; now?: Date },
): AnalyticsStats {
  const now = opts?.now ?? new Date();
  const recentLimit = opts?.recentFeedbackLimit ?? 8;

  const totalScans = scans.length;
  const totalRatings = reviews.length;
  const googleRedirects = reviews.filter((r) => r.submitted_to_google).length;
  const privateFeedbacks = feedbacks.length;
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;
  const conversionRate = totalScans > 0 ? Math.round((googleRedirects / totalScans) * 100) : 0;

  const ratingBreakdown = [1, 2, 3, 4, 5].map((r) => ({
    rating: r,
    label: `${r}★`,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));

  const dailyScans = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    return {
      date: d.toLocaleDateString("en", { weekday: "short" }),
      scans: scans.filter((s) => s.created_at?.startsWith(dateStr)).length,
    };
  });

  const weeklyScans = Array.from({ length: 8 }, (_, i) => {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const count = scans.filter((s) => {
      if (!s.created_at) return false;
      const t = new Date(s.created_at).getTime();
      return t >= start.getTime() && t <= end.getTime();
    }).length;
    return {
      label: `${start.toLocaleDateString("en", { month: "short", day: "numeric" })}`,
      scans: count,
    };
  }).reverse();

  const monthlyScans = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const prefix = `${y}-${String(m + 1).padStart(2, "0")}`;
    const count = scans.filter((s) => s.created_at?.startsWith(prefix)).length;
    return {
      label: d.toLocaleDateString("en", { month: "short", year: "numeric" }),
      scans: count,
    };
  });

  const deviceMap = new Map<string, number>();
  for (const s of scans) {
    const key = (s.device_type || "unknown").toLowerCase();
    deviceMap.set(key, (deviceMap.get(key) ?? 0) + 1);
  }
  const deviceBreakdown = Array.from(deviceMap.entries()).map(([label, count]) => ({ label, count }));

  const tagCounts = new Map<string, number>();
  for (const r of reviews) {
    for (const tag of parseTags(r.selected_tags)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const recentFeedback = [...feedbacks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, recentLimit);

  return {
    totalScans,
    totalRatings,
    googleRedirects,
    privateFeedbacks,
    avgRating,
    conversionRate,
    ratingBreakdown,
    dailyScans,
    weeklyScans,
    monthlyScans,
    deviceBreakdown,
    topTags,
    recentFeedback,
  };
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "rf_super_admin_secret";

type BusinessRow = {
  id: string;
  name: string;
  custom_url_slug: string;
  place_id?: string | null;
  logo_url?: string | null;
  is_active?: boolean | null;
  plan?: string | null;
  owner_email?: string | null;
};

// ─── Tags types ────────────────────────────────────────────────────────────
type ServiceTag = {
  id: string;       // uuid or temp id
  label: string;
  emoji: string;
};

type TagsData = {
  tags: ServiceTag[];
};

function authHeaders(secret: string): HeadersInit {
  return { Authorization: `Bearer ${secret}` };
}

const planColors: Record<string, string> = {
  basic: "#6b7280",
  pro: "#F66E12",
  enterprise: "#FF9500",
};

// ─── Default tag suggestions ────────────────────────────────────────────────
const DEFAULT_TAG_SUGGESTIONS: ServiceTag[] = [
  { id: "d1", label: "Friendly Staff", emoji: "😊" },
  { id: "d2", label: "Clean & Tidy", emoji: "✨" },
  { id: "d3", label: "Fast Service", emoji: "⚡" },
  { id: "d4", label: "Great Value", emoji: "💰" },
  { id: "d5", label: "Comfortable", emoji: "🛋️" },
  { id: "d6", label: "Good Food", emoji: "🍽️" },
  { id: "d7", label: "Good Coffee", emoji: "☕" },
  { id: "d8", label: "Good Ambiance", emoji: "🎶" },
  { id: "d9", label: "Professional", emoji: "💼" },
  { id: "d10", label: "Highly Skilled", emoji: "🏆" },
  { id: "d11", label: "Caring", emoji: "❤️" },
  { id: "d12", label: "On Time", emoji: "⏱️" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
export default function SuperAdminPage() {
  const [secret, setSecret] = useState("");
  const [secretSaved, setSecretSaved] = useState(false);
  const [rows, setRows] = useState<BusinessRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<"add" | "edit" | "tags" | "defaultTags" | null>(null);
  const [editing, setEditing] = useState<BusinessRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    custom_url_slug: "",
    place_id: "",
    logo_url: "",
    owner_email: "",
    plan: "basic",
    is_active: true,
  });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [modalFocused, setModalFocused] = useState<string | null>(null);

  // ── Tags state ────────────────────────────────────────────────────────────
  const [tagsTarget, setTagsTarget] = useState<BusinessRow | null>(null);
  const [editingTags, setEditingTags] = useState<ServiceTag[]>([]);
  const [tagsBusy, setTagsBusy] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagEmoji, setNewTagEmoji] = useState("⭐");

  // ── Default template tags state ───────────────────────────────────────────
  const [defaultTags, setDefaultTags] = useState<ServiceTag[]>(DEFAULT_TAG_SUGGESTIONS.slice(0, 6));
  const [newDefaultLabel, setNewDefaultLabel] = useState("");
  const [newDefaultEmoji, setNewDefaultEmoji] = useState("⭐");

  useEffect(() => {
    setOrigin(window.location.origin);
    const s = sessionStorage.getItem(STORAGE_KEY);
    if (s) {
      setSecret(s);
      setSecretSaved(true);
    }
  }, []);

  const canCall = useMemo(() => secret.trim().length > 0, [secret]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.custom_url_slug.toLowerCase().includes(q) ||
        (b.owner_email ?? "").toLowerCase().includes(q) ||
        (b.plan ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const loadRows = useCallback(async () => {
    if (!canCall) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/businesses", {
        headers: authHeaders(secret.trim()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);
      setRows((json.businesses ?? []) as BusinessRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canCall, secret]);

  const loadDefaultTags = useCallback(async () => {
    if (!canCall) return;
    try {
      const res = await fetch("/api/super-admin/default-tags", {
        headers: authHeaders(secret.trim()),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.tags && json.tags.length > 0) {
          setDefaultTags(json.tags);
        }
      }
    } catch (e) {}
  }, [canCall, secret]);

  useEffect(() => {
    if (secretSaved && canCall) {
      void loadRows();
      void loadDefaultTags();
    }
  }, [secretSaved, canCall, loadRows, loadDefaultTags]);

  function persistSecret() {
    sessionStorage.setItem(STORAGE_KEY, secret.trim());
    setSecretSaved(true);
    void loadRows();
    void loadDefaultTags();
  }

  // ── Business CRUD ─────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null);
    setForm({ name: "", custom_url_slug: "", place_id: "", logo_url: "", owner_email: "", plan: "basic", is_active: true });
    setModal("add");
  }

  function openEdit(b: BusinessRow) {
    setEditing(b);
    setForm({
      name: b.name,
      custom_url_slug: b.custom_url_slug,
      place_id: b.place_id ?? "",
      logo_url: b.logo_url ?? "",
      owner_email: b.owner_email ?? "",
      plan: (b.plan as string) || "basic",
      is_active: b.is_active !== false,
    });
    setModal("edit");
  }

  async function submitForm() {
    if (!canCall) return;
    setBusy(true);
    setError(null);
    try {
      if (modal === "add") {
        const res = await fetch("/api/super-admin/businesses", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders(secret.trim()) },
          body: JSON.stringify({
            name: form.name,
            custom_url_slug: form.custom_url_slug || undefined,
            place_id: form.place_id,
            logo_url: form.logo_url || null,
            owner_email: form.owner_email || null,
            plan: form.plan,
            is_active: form.is_active,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Create failed");
      } else if (modal === "edit" && editing) {
        const res = await fetch(`/api/super-admin/businesses/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders(secret.trim()) },
          body: JSON.stringify({
            name: form.name,
            custom_url_slug: form.custom_url_slug,
            place_id: form.place_id,
            logo_url: form.logo_url || null,
            owner_email: form.owner_email || null,
            plan: form.plan,
            is_active: form.is_active,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Update failed");
      }
      setModal(null);
      await loadRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(b: BusinessRow) {
    if (!canCall) return;
    const currentlyActive = b.is_active !== false;
    setBusy(true);
    try {
      const res = await fetch(`/api/super-admin/businesses/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(secret.trim()) },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Toggle failed");
      await loadRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeBusiness(b: BusinessRow) {
    if (!canCall) return;
    if (!confirm(`Delete "${b.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/super-admin/businesses/${b.id}`, {
        method: "DELETE",
        headers: authHeaders(secret.trim()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed");
      await loadRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadQr(id: string, format: "png" | "svg") {
    if (!canCall) return;
    const u = `/api/super-admin/businesses/${id}/qr?format=${format}`;
    void fetch(u, { headers: authHeaders(secret.trim()) })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = `reviewflow-qr-${id}.${format}`;
        a.click();
        URL.revokeObjectURL(href);
      })
      .catch(() => setError("QR download failed — check service role key and secret."));
  }

  function copyLink(url: string, id: string) {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  // ── Tags CRUD ─────────────────────────────────────────────────────────────
  async function openTagsModal(b: BusinessRow) {
    setTagsTarget(b);
    setTagsError(null);
    setNewTagLabel("");
    setNewTagEmoji("⭐");
    setTagsBusy(true);
    setModal("tags");
    try {
      // Try to load existing tags for this business
      const res = await fetch(`/api/super-admin/businesses/${b.id}/tags`, {
        headers: authHeaders(secret.trim()),
      });
      if (res.ok) {
        const json: TagsData = await res.json().catch(() => ({ tags: [] }));
        setEditingTags(json.tags ?? []);
      } else {
        // If no tags set yet, load default tags as starting point
        setEditingTags(defaultTags.map(t => ({ ...t, id: uid() })));
      }
    } catch {
      setEditingTags(defaultTags.map(t => ({ ...t, id: uid() })));
    } finally {
      setTagsBusy(false);
    }
  }

  function addTag() {
    const label = newTagLabel.trim();
    if (!label) return;
    setEditingTags(prev => [...prev, { id: uid(), label, emoji: newTagEmoji }]);
    setNewTagLabel("");
    setNewTagEmoji("⭐");
  }

  function removeTag(id: string) {
    setEditingTags(prev => prev.filter(t => t.id !== id));
  }

  function moveTag(id: string, dir: -1 | 1) {
    setEditingTags(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  async function saveTags() {
    if (!tagsTarget || !canCall) return;
    setTagsBusy(true);
    setTagsError(null);
    try {
      const res = await fetch(`/api/super-admin/businesses/${tagsTarget.id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(secret.trim()) },
        body: JSON.stringify({ tags: editingTags }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Save failed");
      setModal(null);
    } catch (e) {
      setTagsError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setTagsBusy(false);
    }
  }

  // ── Default template ──────────────────────────────────────────────────────
  function openDefaultTagsModal() {
    setNewDefaultLabel("");
    setNewDefaultEmoji("⭐");
    setModal("defaultTags");
  }

  function addDefaultTag() {
    const label = newDefaultLabel.trim();
    if (!label) return;
    setDefaultTags(prev => [...prev, { id: uid(), label, emoji: newDefaultEmoji }]);
    setNewDefaultLabel("");
    setNewDefaultEmoji("⭐");
  }

  function removeDefaultTag(id: string) {
    setDefaultTags(prev => prev.filter(t => t.id !== id));
  }

  async function saveDefaultTags() {
    if (!canCall) return;
    try {
      const res = await fetch("/api/super-admin/default-tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(secret.trim()) },
        body: JSON.stringify({ tags: defaultTags }),
      });
      if (!res.ok) throw new Error("Save failed");
      setModal(null);
    } catch (e) {
      alert("Failed to save default tags");
    }
  }

  const activeCount = rows.filter((b) => b.is_active !== false).length;
  const proCount = rows.filter((b) => b.plan === "pro").length;
  const enterpriseCount = rows.filter((b) => b.plan === "enterprise").length;

  const inputStyle = (key: string) => ({
    width: "100%",
    padding: "12px 14px",
    background: modalFocused === key ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${modalFocused === key ? "rgba(246,110,18,0.5)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 10,
    fontSize: 13,
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "all 0.2s",
    boxShadow: modalFocused === key ? "0 0 0 3px rgba(246,110,18,0.15)" : "none",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0c0c0e !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .stat-card { animation: fadeUp 0.4s ease both; }
        .stat-card:hover { border-color: rgba(255,255,255,0.12) !important; transform: translateY(-2px); transition: all 0.2s; }
        .row-item:hover { background: rgba(255,255,255,0.05) !important; }
        .action-btn:hover { color: #fff !important; }
        .tag-chip { transition: all 0.15s; }
        .tag-chip:hover { border-color: rgba(246,110,18,0.4) !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #18181f inset !important; -webkit-text-fill-color: #fff !important; }
        select option { background: #18181f; color: #fff; }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#0c0c0e", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Sidebar */}
        <div style={{
          position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
          background: "rgba(255,255,255,0.03)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", padding: "24px 16px", zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, paddingLeft: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#F66E12,#FF9500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>ReviewFlow</span>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10, marginBottom: 4,
            background: "rgba(246,110,18,0.15)",
            border: "1px solid rgba(246,110,18,0.25)",
          }}>
            <span style={{ fontSize: 13, color: "#FF9500" }}>⚙</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>Super Admin</span>
          </div>

          {/* Default Tags shortcut in sidebar */}
          <button
            onClick={openDefaultTagsModal}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, marginBottom: 4, marginTop: 4,
              background: "transparent", border: "1px solid transparent",
              cursor: "pointer", textAlign: "left", width: "100%",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontSize: 13 }}>🏷️</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>Default Tags</span>
          </button>

          <div style={{ marginTop: "auto" }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#F66E12,#FF9500)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                S
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>Super Admin</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Full access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ marginLeft: 220, padding: "32px 40px", minHeight: "100vh" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36, animation: "fadeUp 0.4s ease both" }}>
            <div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>ReviewFlow</p>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                Super Admin
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                Manage clients, plans, activation, QR codes & service tags
              </p>
            </div>
            {/* Default Tags button in header */}
            <button
              onClick={openDefaultTagsModal}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, fontSize: 13, fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer", fontFamily: "'Syne', sans-serif",
                transition: "all 0.2s",
              }}
            >
              🏷️ Default Tags Template
            </button>
          </div>

          {/* Stats strip */}
          {secretSaved && rows.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Total Clients", value: rows.length, icon: "🏢", delay: "0s" },
                { label: "Active", value: activeCount, icon: "✅", delay: "0.07s" },
                { label: "Pro Plan", value: proCount, icon: "⚡", delay: "0.14s" },
                { label: "Enterprise", value: enterpriseCount, icon: "🏆", delay: "0.21s" },
              ].map((stat) => (
                <div key={stat.label} className="stat-card" style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 18, padding: "20px", animationDelay: stat.delay,
                }}>
                  <p style={{ fontSize: 20, marginBottom: 12 }}>{stat.icon}</p>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", marginBottom: 4 }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* API Secret card */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, padding: 24, marginBottom: 20,
            animation: "fadeUp 0.4s 0.1s ease both", opacity: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>🔑</span>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Admin API Access
              </p>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 16, lineHeight: 1.6 }}>
              Set <code style={{ background: "rgba(255,255,255,0.07)", padding: "2px 6px", borderRadius: 5, fontFamily: "monospace", color: "#FF9500" }}>REVIEWFLOW_SUPER_ADMIN_SECRET</code> and{" "}
              <code style={{ background: "rgba(255,255,255,0.07)", padding: "2px 6px", borderRadius: 5, fontFamily: "monospace", color: "#FF9500" }}>SUPABASE_SERVICE_ROLE_KEY</code> on the server. Paste the same secret here (stored in sessionStorage).
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="password"
                  autoComplete="off"
                  placeholder="Paste super admin secret…"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  onFocus={() => setFocused("secret")}
                  onBlur={() => setFocused(null)}
                  onKeyDown={(e) => e.key === "Enter" && secret.trim() && persistSecret()}
                  style={{
                    width: "100%", padding: "13px 16px",
                    background: focused === "secret" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${focused === "secret" ? "rgba(246,110,18,0.5)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 12, fontSize: 14, color: "#fff",
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none", transition: "all 0.2s",
                    boxShadow: focused === "secret" ? "0 0 0 3px rgba(246,110,18,0.15)" : "none",
                  }}
                />
              </div>
              <button
                onClick={persistSecret}
                disabled={!secret.trim()}
                style={{
                  padding: "13px 22px",
                  background: secret.trim() ? "linear-gradient(135deg, #F66E12, #FF9500)" : "rgba(246,110,18,0.2)",
                  border: "none", borderRadius: 12,
                  color: secret.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: 600, fontFamily: "'Syne', sans-serif",
                  cursor: secret.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s", whiteSpace: "nowrap",
                  boxShadow: secret.trim() ? "0 6px 24px rgba(246,110,18,0.35)" : "none",
                }}
              >
                Save &amp; Load
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 14, padding: "12px 16px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 10,
              animation: "fadeUp 0.3s ease both",
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <p style={{ fontSize: 13, color: "#fca5a5" }}>{error}</p>
            </div>
          )}

          {/* Clients table */}
          {secretSaved && canCall && (
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, overflow: "hidden",
              animation: "fadeUp 0.4s 0.25s ease both", opacity: 0,
            }}>
              {/* Table header bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                gap: 14, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Clients
                  </p>
                  {rows.length > 0 && (
                    <div style={{ padding: "2px 10px", borderRadius: 99, background: "rgba(246,110,18,0.15)", border: "1px solid rgba(246,110,18,0.25)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#FF9500" }}>{rows.length}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Search clients…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setFocused("search")}
                    onBlur={() => setFocused(null)}
                    style={{
                      padding: "8px 14px",
                      background: focused === "search" ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${focused === "search" ? "rgba(246,110,18,0.4)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 10, fontSize: 13, color: "#fff",
                      fontFamily: "'DM Sans', sans-serif",
                      outline: "none", width: 200, transition: "all 0.2s",
                    }}
                  />
                  <button
                    onClick={() => void loadRows()}
                    disabled={loading || busy}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)",
                      cursor: loading || busy ? "not-allowed" : "pointer", transition: "all 0.2s",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        Loading
                      </span>
                    ) : "↻ Refresh"}
                  </button>
                  <button
                    onClick={openAdd}
                    disabled={busy}
                    style={{
                      padding: "8px 18px",
                      background: "linear-gradient(135deg, #F66E12, #FF9500)",
                      border: "none", borderRadius: 10,
                      fontSize: 13, fontWeight: 600, color: "#fff",
                      fontFamily: "'Syne', sans-serif",
                      cursor: busy ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 16px rgba(246,110,18,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    + Add Business
                  </button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                  <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#FF9500", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {["Business", "Slug", "Plan", "Status", "Owner Email", "Actions"].map((h) => (
                          <th key={h} style={{
                            padding: "12px 20px", textAlign: "left",
                            fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)",
                            textTransform: "uppercase", letterSpacing: "0.08em",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "60px 20px", textAlign: "center" }}>
                            <p style={{ fontSize: 28, marginBottom: 10 }}>🏢</p>
                            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }}>
                              {search ? "No clients match your search." : "No businesses yet. Add one above."}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((b) => {
                          const url = origin ? `${origin}/review/${encodeURIComponent(b.custom_url_slug)}` : "";
                          const active = b.is_active !== false;
                          const pc = planColors[b.plan ?? "basic"] ?? "#6b7280";
                          return (
                            <tr
                              key={b.id}
                              className="row-item"
                              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                            >
                              {/* Business */}
                              <td style={{ padding: "14px 20px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: 9,
                                    background: "linear-gradient(135deg,#F66E12,#ec4899)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                                  }}>
                                    {b.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{b.name}</span>
                                </div>
                              </td>

                              {/* Slug */}
                              <td style={{ padding: "14px 20px" }}>
                                <span style={{ fontSize: 12, color: "#FF9500", fontFamily: "monospace", background: "rgba(246,110,18,0.1)", padding: "3px 8px", borderRadius: 6 }}>
                                  {b.custom_url_slug}
                                </span>
                              </td>

                              {/* Plan */}
                              <td style={{ padding: "14px 20px" }}>
                                <div style={{
                                  display: "inline-flex", padding: "3px 10px", borderRadius: 99,
                                  background: `${pc}15`, border: `1px solid ${pc}35`,
                                }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: pc, textTransform: "capitalize" }}>
                                    {b.plan ?? "basic"}
                                  </span>
                                </div>
                              </td>

                              {/* Active toggle */}
                              <td style={{ padding: "14px 20px" }}>
                                <button
                                  disabled={busy}
                                  onClick={() => void toggleActive(b)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "5px 12px", borderRadius: 99, cursor: busy ? "not-allowed" : "pointer",
                                    background: active ? "rgba(22,163,74,0.12)" : "rgba(239,68,68,0.1)",
                                    border: `1px solid ${active ? "rgba(22,163,74,0.3)" : "rgba(239,68,68,0.25)"}`,
                                    transition: "all 0.2s",
                                  }}
                                >
                                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#22c55e" : "#ef4444", animation: active ? "pulse 2s infinite" : "none" }} />
                                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#22c55e" : "#ef4444" }}>
                                    {active ? "Active" : "Inactive"}
                                  </span>
                                </button>
                              </td>

                              {/* Owner */}
                              <td style={{ padding: "14px 20px", maxWidth: 180 }}>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                                  {b.owner_email ?? "—"}
                                </span>
                              </td>

                              {/* Actions */}
                              <td style={{ padding: "14px 20px" }}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  <Link href={`/review/${b.custom_url_slug}`} style={{
                                    fontSize: 11, fontWeight: 600, color: "#FF9500",
                                    textDecoration: "none", padding: "4px 10px",
                                    background: "rgba(246,110,18,0.12)", borderRadius: 7,
                                    border: "1px solid rgba(246,110,18,0.2)", transition: "all 0.15s",
                                  }}>Open</Link>

                                  <Link href={`/admin/${b.id}`} style={{
                                    fontSize: 11, fontWeight: 600, color: "#FF9500",
                                    textDecoration: "none", padding: "4px 10px",
                                    background: "rgba(246,110,18,0.12)", borderRadius: 7,
                                    border: "1px solid rgba(246,110,18,0.2)", transition: "all 0.15s",
                                  }}>Analytics</Link>

                                  {/* ★ NEW: Tags button */}
                                  <button
                                    className="action-btn"
                                    onClick={() => void openTagsModal(b)}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "#F66E12",
                                      background: "rgba(246,110,18,0.08)", borderRadius: 7,
                                      border: "1px solid rgba(246,110,18,0.2)",
                                      padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >🏷️ Tags</button>

                                  <button
                                    className="action-btn"
                                    onClick={() => openEdit(b)}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)",
                                      background: "rgba(255,255,255,0.05)", borderRadius: 7,
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >Edit</button>

                                  <button
                                    className="action-btn"
                                    onClick={() => void downloadQr(b.id, "png")}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)",
                                      background: "rgba(255,255,255,0.05)", borderRadius: 7,
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >QR PNG</button>

                                  <button
                                    className="action-btn"
                                    onClick={() => void downloadQr(b.id, "svg")}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)",
                                      background: "rgba(255,255,255,0.05)", borderRadius: 7,
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >QR SVG</button>

                                  {url && (
                                    <button
                                      onClick={() => copyLink(url, b.id)}
                                      style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: copied === b.id ? "#22c55e" : "rgba(255,255,255,0.45)",
                                        background: copied === b.id ? "rgba(22,163,74,0.1)" : "rgba(255,255,255,0.05)",
                                        borderRadius: 7,
                                        border: `1px solid ${copied === b.id ? "rgba(22,163,74,0.25)" : "rgba(255,255,255,0.08)"}`,
                                        padding: "4px 10px", cursor: "pointer", transition: "all 0.2s",
                                      }}
                                    >
                                      {copied === b.id ? "✓ Copied" : "Copy link"}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => void removeBusiness(b)}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "rgba(239,68,68,0.6)",
                                      background: "rgba(239,68,68,0.08)", borderRadius: 7,
                                      border: "1px solid rgba(239,68,68,0.15)",
                                      padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >Delete</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ═══ MODAL: Add / Edit Business ═══════════════════════════════════════ */}
      {(modal === "add" || modal === "edit") && (
        <div
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div style={{
            width: "100%", maxWidth: 520,
            background: "#111116", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24, padding: 32,
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            maxHeight: "90vh", overflowY: "auto",
            animation: "fadeUp 0.25s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
                  {modal === "add" ? "Add Business" : "Edit Business"}
                </h2>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                  {modal === "add" ? "Create a new client account" : `Editing ${editing?.name}`}
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)", fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "name", label: "Business Name *", placeholder: "Acme Corp", type: "text" },
                { key: "custom_url_slug", label: "URL Slug", placeholder: "acme-corp", type: "text", mono: true, hint: "(optional, auto-generated)" },
                { key: "place_id", label: "Google Place ID *", placeholder: "ChIJ...", type: "text", mono: true },
                { key: "logo_url", label: "Logo URL", placeholder: "https://...", type: "text" },
                { key: "owner_email", label: "Owner Email", placeholder: "owner@business.com", type: "email", hint: "(dashboard login)" },
              ].map(({ key, label, placeholder, type, mono, hint }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    {label} {hint && <span style={{ color: "rgba(255,255,255,0.2)", textTransform: "none", fontWeight: 400 }}>{hint}</span>}
                  </label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    onFocus={() => setModalFocused(key)}
                    onBlur={() => setModalFocused(null)}
                    placeholder={placeholder}
                    style={{ ...inputStyle(key), ...(mono ? { fontFamily: "monospace", fontSize: 12 } : {}) }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm(f => ({ ...f, plan: e.target.value }))}
                  style={{
                    width: "100%", padding: "12px 14px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, fontSize: 13, color: "#fff",
                    fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer", appearance: "none",
                  }}
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>Account active</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Review page will be publicly accessible</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  style={{
                    width: 44, height: 24, borderRadius: 99,
                    background: form.is_active ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.1)",
                    border: "none", cursor: "pointer", position: "relative", transition: "all 0.25s", flexShrink: 0,
                    boxShadow: form.is_active ? "0 0 12px rgba(34,197,94,0.3)" : "none",
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 3, left: form.is_active ? 23 : 3,
                    transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button onClick={() => setModal(null)} style={{
                flex: 1, padding: "13px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.5)",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}>Cancel</button>
              <button
                onClick={() => void submitForm()}
                disabled={busy || !form.name.trim() || !form.place_id.trim()}
                style={{
                  flex: 2, padding: "13px",
                  background: busy || !form.name.trim() || !form.place_id.trim() ? "rgba(246,110,18,0.3)" : "linear-gradient(135deg, #F66E12, #FF9500)",
                  border: "none", borderRadius: 12,
                  fontSize: 14, fontWeight: 700,
                  color: busy || !form.name.trim() || !form.place_id.trim() ? "rgba(255,255,255,0.3)" : "#fff",
                  cursor: busy || !form.name.trim() || !form.place_id.trim() ? "not-allowed" : "pointer",
                  fontFamily: "'Syne', sans-serif",
                  boxShadow: busy || !form.name.trim() || !form.place_id.trim() ? "none" : "0 6px 24px rgba(246,110,18,0.4)",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {busy ? (
                  <>
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Saving…
                  </>
                ) : modal === "add" ? "Create Business →" : "Save Changes →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Tags management per business ══════════════════════════════ */}
      {modal === "tags" && tagsTarget && (
        <div
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div style={{
            width: "100%", maxWidth: 580,
            background: "#111116", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24, padding: 32,
            boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            maxHeight: "90vh", overflowY: "auto",
            animation: "fadeUp 0.25s ease both",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "linear-gradient(135deg,#FF9500,#F66E12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>🏷️</div>
                <div>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
                    Service Tags
                  </h2>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {tagsTarget.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)", fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 24, lineHeight: 1.6 }}>
              These tags appear on the customer review page under "What did you love?" — customers tap them to give quick feedback.
              If none are set, the <strong style={{ color: "rgba(255,255,255,0.4)" }}>Default Template</strong> is used.
            </p>

            {tagsError && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "#fca5a5",
              }}>⚠️ {tagsError}</div>
            )}

            {/* Current tags list */}
            {tagsBusy ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                <div style={{ width: 28, height: 28, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#F66E12", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : (
              <>
                {editingTags.length === 0 ? (
                  <div style={{
                    border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 14,
                    padding: "32px 20px", textAlign: "center", marginBottom: 20,
                  }}>
                    <p style={{ fontSize: 24, marginBottom: 8 }}>🏷️</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No tags yet. Add some below, or they'll fall back to the default template.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {editingTags.map((tag, idx) => (
                      <div
                        key={tag.id}
                        className="tag-chip"
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 14px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 12,
                        }}
                      >
                        {/* Emoji picker (simple input) */}
                        <input
                          value={tag.emoji}
                          onChange={e => setEditingTags(prev => prev.map(t => t.id === tag.id ? { ...t, emoji: e.target.value } : t))}
                          style={{
                            width: 40, textAlign: "center", fontSize: 18,
                            background: "transparent", border: "none", outline: "none", cursor: "text",
                            color: "#fff",
                          }}
                          maxLength={4}
                        />
                        {/* Label */}
                        <input
                          value={tag.label}
                          onChange={e => setEditingTags(prev => prev.map(t => t.id === tag.id ? { ...t, label: e.target.value } : t))}
                          style={{
                            flex: 1, background: "transparent", border: "none", outline: "none",
                            fontSize: 14, color: "#fff", fontFamily: "'DM Sans', sans-serif",
                          }}
                        />
                        {/* Order buttons */}
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => moveTag(tag.id, -1)}
                            disabled={idx === 0}
                            style={{
                              width: 26, height: 26, borderRadius: 6,
                              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                              color: idx === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
                              fontSize: 12, cursor: idx === 0 ? "default" : "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >↑</button>
                          <button
                            onClick={() => moveTag(tag.id, 1)}
                            disabled={idx === editingTags.length - 1}
                            style={{
                              width: 26, height: 26, borderRadius: 6,
                              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                              color: idx === editingTags.length - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
                              fontSize: 12, cursor: idx === editingTags.length - 1 ? "default" : "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >↓</button>
                        </div>
                        {/* Remove */}
                        <button
                          onClick={() => removeTag(tag.id)}
                          style={{
                            width: 26, height: 26, borderRadius: 6,
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                            color: "rgba(239,68,68,0.7)", fontSize: 14, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new tag row */}
                <div style={{
                  background: "rgba(246,110,18,0.05)", border: "1px solid rgba(246,110,18,0.15)",
                  borderRadius: 14, padding: 16, marginBottom: 20,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(246,110,18,0.8)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                    Add New Tag
                  </p>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      value={newTagEmoji}
                      onChange={e => setNewTagEmoji(e.target.value)}
                      maxLength={4}
                      placeholder="😊"
                      style={{
                        width: 52, textAlign: "center", fontSize: 20,
                        padding: "10px 6px",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10, color: "#fff", outline: "none",
                      }}
                    />
                    <input
                      value={newTagLabel}
                      onChange={e => setNewTagLabel(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTag()}
                      placeholder="Tag label, e.g. Great Coffee"
                      style={{
                        flex: 1, padding: "11px 14px",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10, fontSize: 13, color: "#fff",
                        fontFamily: "'DM Sans', sans-serif", outline: "none",
                      }}
                    />
                    <button
                      onClick={addTag}
                      disabled={!newTagLabel.trim()}
                      style={{
                        padding: "11px 18px",
                        background: newTagLabel.trim() ? "linear-gradient(135deg,#FF9500,#F66E12)" : "rgba(246,110,18,0.15)",
                        border: "none", borderRadius: 10,
                        color: newTagLabel.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                        fontSize: 13, fontWeight: 600, cursor: newTagLabel.trim() ? "pointer" : "not-allowed",
                        fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap",
                      }}
                    >+ Add</button>
                  </div>

                  {/* Quick suggestions */}
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>QUICK ADD:</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {DEFAULT_TAG_SUGGESTIONS.filter(s => !editingTags.some(t => t.label === s.label)).slice(0, 8).map(s => (
                        <button
                          key={s.id}
                          onClick={() => setEditingTags(prev => [...prev, { ...s, id: uid() }])}
                          style={{
                            padding: "4px 10px", borderRadius: 99,
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                          }}
                        >
                          {s.emoji} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setModal(null)} style={{
                    flex: 1, padding: "13px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.5)",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>Cancel</button>
                  <button
                    onClick={() => void saveTags()}
                    disabled={tagsBusy}
                    style={{
                      flex: 2, padding: "13px",
                      background: tagsBusy ? "rgba(246,110,18,0.2)" : "linear-gradient(135deg,#FF9500,#F66E12)",
                      border: "none", borderRadius: 12,
                      fontSize: 14, fontWeight: 700, color: tagsBusy ? "rgba(255,255,255,0.3)" : "#fff",
                      cursor: tagsBusy ? "not-allowed" : "pointer",
                      fontFamily: "'Syne', sans-serif",
                      boxShadow: tagsBusy ? "none" : "0 6px 24px rgba(246,110,18,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {tagsBusy ? (
                      <>
                        <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        Saving…
                      </>
                    ) : "Save Tags →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL: Default Tags Template ════════════════════════════════════ */}
      {modal === "defaultTags" && (
        <div
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div style={{
            width: "100%", maxWidth: 560,
            background: "#111116", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24, padding: 32,
            boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            maxHeight: "90vh", overflowY: "auto",
            animation: "fadeUp 0.25s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "linear-gradient(135deg,#F66E12,#FF9500)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>🗂️</div>
                <div>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
                    Default Tags Template
                  </h2>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    Used when a business has no custom tags set
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)", fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 24, lineHeight: 1.6 }}>
              This template is shown on the review page for any business that doesn&apos;t have custom tags set. You can override these per-business using the <strong style={{ color: "rgba(255,255,255,0.4)" }}>🏷️ Tags</strong> button on each row.
            </p>

            {/* Default tags list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {defaultTags.map((tag) => (
                <div key={tag.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                }}>
                  <input
                    value={tag.emoji}
                    onChange={e => setDefaultTags(prev => prev.map(t => t.id === tag.id ? { ...t, emoji: e.target.value } : t))}
                    style={{ width: 40, textAlign: "center", fontSize: 18, background: "transparent", border: "none", outline: "none", color: "#fff" }}
                    maxLength={4}
                  />
                  <input
                    value={tag.label}
                    onChange={e => setDefaultTags(prev => prev.map(t => t.id === tag.id ? { ...t, label: e.target.value } : t))}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button
                    onClick={() => removeDefaultTag(tag.id)}
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                      color: "rgba(239,68,68,0.7)", fontSize: 14, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >×</button>
                </div>
              ))}
            </div>

            {/* Add default tag */}
            <div style={{
              background: "rgba(246,110,18,0.05)", border: "1px solid rgba(246,110,18,0.15)",
              borderRadius: 14, padding: 16, marginBottom: 20,
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(246,110,18,0.8)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                Add Tag to Template
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  value={newDefaultEmoji}
                  onChange={e => setNewDefaultEmoji(e.target.value)}
                  maxLength={4}
                  placeholder="😊"
                  style={{
                    width: 52, textAlign: "center", fontSize: 20,
                    padding: "10px 6px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, color: "#fff", outline: "none",
                  }}
                />
                <input
                  value={newDefaultLabel}
                  onChange={e => setNewDefaultLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addDefaultTag()}
                  placeholder="Tag label"
                  style={{
                    flex: 1, padding: "11px 14px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, fontSize: 13, color: "#fff",
                    fontFamily: "'DM Sans', sans-serif", outline: "none",
                  }}
                />
                <button
                  onClick={addDefaultTag}
                  disabled={!newDefaultLabel.trim()}
                  style={{
                    padding: "11px 18px",
                    background: newDefaultLabel.trim() ? "linear-gradient(135deg,#F66E12,#FF9500)" : "rgba(246,110,18,0.15)",
                    border: "none", borderRadius: 10,
                    color: newDefaultLabel.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                    fontSize: 13, fontWeight: 600, cursor: newDefaultLabel.trim() ? "pointer" : "not-allowed",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >+ Add</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModal(null)} style={{
                flex: 1, padding: "13px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.5)",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>Cancel</button>
              <button
                onClick={saveDefaultTags}
                style={{
                  flex: 2, padding: "13px",
                  background: "linear-gradient(135deg,#F66E12,#FF9500)",
                  border: "none", borderRadius: 12,
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  cursor: "pointer", fontFamily: "'Syne', sans-serif",
                  boxShadow: "0 6px 24px rgba(246,110,18,0.35)",
                }}
              >Save Template →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
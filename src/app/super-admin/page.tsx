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
  basic: "#94A3B8",
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

  const [modal, setModal] = useState<"add" | "edit" | "tags" | "defaultTags" | "offer" | null>(null);
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

  // ── Category Tags state ───────────────────────────────────────────────────
  const [editingCategoryTags, setEditingCategoryTags] = useState<ServiceTag[]>([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("🏷️");
  const [tagsActiveTab, setTagsActiveTab] = useState<"service" | "category">("service");

  // ── Default template tags state ───────────────────────────────────────────
  const [defaultTags, setDefaultTags] = useState<ServiceTag[]>(DEFAULT_TAG_SUGGESTIONS.slice(0, 6));
  const [newDefaultLabel, setNewDefaultLabel] = useState("");
  const [newDefaultEmoji, setNewDefaultEmoji] = useState("⭐");

  // ── Offer state ───────────────────────────────────────────────────────────
  type Offer = { title: string; description: string; code: string; expiry: string; emoji: string };
  const emptyOffer = (): Offer => ({ title: "", description: "", code: "", expiry: "", emoji: "🎁" });
  const [offerTarget, setOfferTarget] = useState<BusinessRow | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerDraft, setOfferDraft] = useState<Offer>(emptyOffer());
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

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
    setNewCategoryLabel("");
    setNewCategoryEmoji("🏷️");
    setTagsActiveTab("service");
    setTagsBusy(true);
    setModal("tags");
    try {
      // Try to load existing tags for this business
      const res = await fetch(`/api/super-admin/businesses/${b.id}/tags`, {
        headers: authHeaders(secret.trim()),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({ serviceTags: [], categoryTags: [] }));
        // API returns { serviceTags, categoryTags }
        setEditingTags(json.serviceTags ?? json.tags ?? []);
        setEditingCategoryTags(json.categoryTags ?? []);
      } else {
        // If no tags set yet, load default tags as starting point
        setEditingTags(defaultTags.map(t => ({ ...t, id: uid() })));
        setEditingCategoryTags([]);
      }
    } catch {
      setEditingTags(defaultTags.map(t => ({ ...t, id: uid() })));
      setEditingCategoryTags([]);
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

  // ── Category tag helpers ──────────────────────────────────────────────────
  function addCategoryTag() {
    const label = newCategoryLabel.trim();
    if (!label) return;
    setEditingCategoryTags(prev => [...prev, { id: uid(), label, emoji: newCategoryEmoji }]);
    setNewCategoryLabel("");
    setNewCategoryEmoji("🏷️");
  }

  function removeCategoryTag(id: string) {
    setEditingCategoryTags(prev => prev.filter(t => t.id !== id));
  }

  function moveCategoryTag(id: string, dir: -1 | 1) {
    setEditingCategoryTags(prev => {
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
        body: JSON.stringify({ serviceTags: editingTags, categoryTags: editingCategoryTags }),
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

  // ── Offer CRUD ────────────────────────────────────────────────────────────
  async function openOfferModal(b: BusinessRow) {
    setOfferTarget(b);
    setOfferError(null);
    setOfferDraft(emptyOffer());
    setOfferBusy(true);
    setModal("offer");
    try {
      const res = await fetch(`/api/super-admin/businesses/${b.id}/offer`, {
        headers: authHeaders(secret.trim()),
      });
      if (res.ok) {
        const json = await res.json();
        setOffers(Array.isArray(json.offers) ? json.offers : []);
      } else {
        setOffers([]);
      }
    } catch {
      setOffers([]);
    } finally {
      setOfferBusy(false);
    }
  }

  function addOfferToDraft() {
    if (!offerDraft.title.trim()) { setOfferError("Title is required"); return; }
    setOffers(prev => [...prev, { ...offerDraft }]);
    setOfferDraft(emptyOffer());
    setOfferError(null);
  }

  function removeOfferAt(index: number) {
    setOffers(prev => prev.filter((_, i) => i !== index));
  }

  async function saveOffers() {
    if (!offerTarget || !canCall) return;
    setOfferBusy(true);
    setOfferError(null);
    try {
      const res = await fetch(`/api/super-admin/businesses/${offerTarget.id}/offer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders(secret.trim()) },
        body: JSON.stringify({ offers }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Save failed");
      setModal(null);
    } catch (e) {
      setOfferError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setOfferBusy(false);
    }
  }

  const activeCount = rows.filter((b) => b.is_active !== false).length;
  const proCount = rows.filter((b) => b.plan === "pro").length;
  const enterpriseCount = rows.filter((b) => b.plan === "enterprise").length;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const inputStyle = (key: string) => ({
    width: "100%",
    padding: "12px 14px",
    background: modalFocused === key ? "#E2E8F0" : "#F1F5F9",
    border: `1px solid ${modalFocused === key ? "#F97316" : "#E2E8F0"}`,
    borderRadius: 10,
    fontSize: 13,
    color: "#0F172A",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    transition: "all 0.2s",
    boxShadow: modalFocused === key ? "0 0 0 3px rgba(246,110,18,0.15)" : "none",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F7F7F7 !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .stat-card { animation: fadeUp 0.4s ease both; transition: all 0.2s; }
        .stat-card:hover { border-color: rgba(246,110,18,0.25) !important; transform: translateY(-3px); box-shadow: 0 8px 32px rgba(246,110,18,0.09) !important; }
        .row-item:hover { background: #FAFAFA !important; }
        .action-btn { transition: all 0.15s; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .tag-chip { transition: all 0.15s; }
        .tag-chip:hover { border-color: rgba(246,110,18,0.35) !important; }
        .sidebar-btn:hover { background: rgba(246,110,18,0.07) !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(246,110,18,0.2); border-radius: 99px; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important; -webkit-text-fill-color: #1C1C1C !important; }
        select option { background: #FFFFFF; color: #1C1C1C; }
        .sa-table th { background: #F7F7F7; }
        /* ── Responsive ── */
        .sa-sidebar {
          position: fixed; left: 0; top: 0; bottom: 0; width: 232px;
          background: #FFFFFF; border-right: 1px solid #E8E8E8;
          display: flex; flex-direction: column; padding: 28px 16px; z-index: 200;
          box-shadow: 1px 0 0 rgba(0,0,0,0.03);
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .sa-main { margin-left: 232px; padding: 36px 40px; min-height: 100vh; }
        .sa-hamburger { display: none; }
        .sa-overlay { display: none; }
        .sa-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 28px; }
        .sa-header-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 36px; animation: fadeUp 0.4s ease both; }
        .sa-header-btn { display: flex; }
        @media (max-width: 768px) {
          .sa-sidebar { transform: translateX(-100%); }
          .sa-sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.18); }
          .sa-main { margin-left: 0; padding: 20px 16px; }
          .sa-hamburger { display: flex; align-items: center; justify-content: center; position: fixed; top: 14px; left: 14px; z-index: 300; width: 40px; height: 40px; border-radius: 10px; background: #FFFFFF; border: 1px solid #E8E8E8; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .sa-overlay { display: block; position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,0.45); backdrop-filter: blur(2px); }
          .sa-stats-grid { grid-template-columns: repeat(2,1fr); }
          .sa-header-row { flex-direction: column; gap: 14px; }
          .sa-header-btn { width: 100%; }
          .sa-header-btn button { width: 100%; justify-content: center; }
        }
        @media (max-width: 420px) {
          .sa-stats-grid { grid-template-columns: repeat(2,1fr); gap: 10px; }
          .sa-main { padding: 16px 12px; }
        }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#F7F7F7", fontFamily: "'Inter', sans-serif" }}>

        {/* ── Hamburger (mobile only) ─────────────────────────────────── */}
        <button
          className="sa-hamburger"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>

        {/* ── Sidebar overlay (mobile) ────────────────────────────────── */}
        {sidebarOpen && (
          <div className="sa-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ══ Sidebar ══════════════════════════════════════════════════════ */}
        <aside className={`sa-sidebar${sidebarOpen ? " open" : ""}`}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, paddingLeft: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: "linear-gradient(135deg, #FF9500, #FF0000)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 20px rgba(246,110,18,0.30)", flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 800, color: "#1C1C1C", letterSpacing: "-0.03em", lineHeight: 1 }}>ReviewFlow</p>
              <p style={{ fontSize: 10, color: "#A0A0A0", marginTop: 2 }}>Super Admin</p>
            </div>
          </div>

          {/* Nav label */}
          <p style={{ fontSize: 10, fontWeight: 600, color: "#A0A0A0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 12 }}>Management</p>

          {/* Active nav item */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10, marginBottom: 2,
            background: "rgba(246,110,18,0.10)",
            border: "1px solid rgba(246,110,18,0.22)",
          }}>
            <span style={{ fontSize: 14, color: "#F66E12", width: 18, textAlign: "center" }}>⚙</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1C" }}>Super Admin</span>
            <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#F66E12" }} />
          </div>

          {/* Default Tags shortcut */}
          <button
            onClick={() => { openDefaultTagsModal(); setSidebarOpen(false); }}
            className="sidebar-btn"
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, marginBottom: 2, marginTop: 2,
              background: "transparent", border: "1px solid transparent",
              cursor: "pointer", textAlign: "left", width: "100%",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 14, color: "#A0A0A0", width: 18, textAlign: "center" }}>🏷️</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#5A5A5A" }}>Default Tags</span>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "#E8E8E8", margin: "16px 0" }} />

          {/* Account */}
          <div style={{ marginTop: "auto" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 12, background: "#F4F4F4", border: "1px solid #E8E8E8",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg, #FF9500, #FF0000)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                boxShadow: "0 2px 8px rgba(246,110,18,0.25)",
              }}>S</div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1C1C1C" }}>Super Admin</p>
                <p style={{ fontSize: 10, color: "#A0A0A0", marginTop: 1 }}>Full access</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ══ Main content ═════════════════════════════════════════════════ */}
        <div className="sa-main">

          {/* Header */}
          <div className="sa-header-row" style={{ paddingTop: 8 }}>
            <div>
              <p style={{ fontSize: 11, color: "#A0A0A0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>ReviewFlow</p>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 800, color: "#1C1C1C", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                Super Admin
              </h1>
              <p style={{ fontSize: 13, color: "#A0A0A0", marginTop: 6 }}>
                Manage clients, plans, activation, QR codes &amp; service tags
              </p>
            </div>
            {/* Default Tags button in header */}
            <div className="sa-header-btn">
              <button
                onClick={openDefaultTagsModal}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 18px",
                  background: "#FFFFFF",
                  border: "1px solid #E8E8E8",
                  borderRadius: 12, fontSize: 13, fontWeight: 600,
                  color: "#5A5A5A",
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                🏷️ Default Tags Template
              </button>
            </div>
          </div>

          {/* Stats strip */}
          {secretSaved && rows.length > 0 && (
            <div className="sa-stats-grid">
              {[
                { label: "Total Clients", value: rows.length,      icon: "🏢", delay: "0s" },
                { label: "Active",        value: activeCount,       icon: "✅", delay: "0.07s" },
                { label: "Pro Plan",      value: proCount,          icon: "⚡", delay: "0.14s" },
                { label: "Enterprise",    value: enterpriseCount,   icon: "🏆", delay: "0.21s" },
              ].map((stat) => (
                <div key={stat.label} className="stat-card" style={{
                  background: "#FFFFFF", border: "1px solid #E8E8E8",
                  borderRadius: 18, padding: "22px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  animationDelay: stat.delay,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: "rgba(246,110,18,0.08)", border: "1px solid rgba(246,110,18,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17, marginBottom: 14,
                  }}>{stat.icon}</div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 800, color: "#1C1C1C", letterSpacing: "-0.04em", marginBottom: 4 }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: "#A0A0A0", fontWeight: 500 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* API Secret card */}
          <div style={{
            background: "#FFFFFF", border: "1px solid #E8E8E8",
            borderRadius: 20, padding: 24, marginBottom: 20,
            animation: "fadeUp 0.4s 0.1s ease both", opacity: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(246,110,18,0.08)", border: "1px solid rgba(246,110,18,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🔑</div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#A0A0A0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Admin API Access
              </p>
            </div>
            <p style={{ fontSize: 12, color: "#A0A0A0", marginBottom: 16, lineHeight: 1.6 }}>
              Set <code style={{ background: "#F4F4F4", padding: "2px 6px", borderRadius: 5, fontFamily: "monospace", color: "#F66E12", fontSize: 11 }}>REVIEWFLOW_SUPER_ADMIN_SECRET</code> and{" "}
              <code style={{ background: "#F4F4F4", padding: "2px 6px", borderRadius: 5, fontFamily: "monospace", color: "#F66E12", fontSize: 11 }}>SUPABASE_SERVICE_ROLE_KEY</code> on the server. Paste the same secret here (stored in sessionStorage).
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
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
                    background: focused === "secret" ? "#FFFFFF" : "#F4F4F4",
                    border: `1.5px solid ${focused === "secret" ? "#F66E12" : "#E8E8E8"}`,
                    borderRadius: 12, fontSize: 14, color: "#1C1C1C",
                    fontFamily: "'Inter', sans-serif",
                    outline: "none", transition: "all 0.2s",
                    boxShadow: focused === "secret" ? "0 0 0 3px rgba(246,110,18,0.12)" : "none",
                  }}
                />
              </div>
              <button
                onClick={persistSecret}
                disabled={!secret.trim()}
                style={{
                  padding: "13px 22px",
                  background: secret.trim() ? "linear-gradient(135deg, #FF9500, #FF0000)" : "#F4F4F4",
                  border: "none", borderRadius: 12,
                  color: secret.trim() ? "#fff" : "#A0A0A0",
                  fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
                  cursor: secret.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s", whiteSpace: "nowrap",
                  boxShadow: secret.trim() ? "0 6px 20px rgba(246,110,18,0.30)" : "none",
                }}
              >
                Save &amp; Load
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#FFF1F0", border: "1px solid #FFCCC7",
              borderRadius: 12, padding: "12px 16px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 10,
              animation: "fadeUp 0.3s ease both",
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <p style={{ fontSize: 13, color: "#CF1322", fontWeight: 500 }}>{error}</p>
            </div>
          )}

          {/* Clients table */}
          {secretSaved && canCall && (
            <div style={{
              background: "#F1F5F9", border: "1px solid #E2E8F0",
              borderRadius: 20, overflow: "hidden",
              animation: "fadeUp 0.4s 0.25s ease both", opacity: 0,
            }}>
              {/* Table header bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 24px", borderBottom: "1px solid rgba(15,23,42,0.06)",
                gap: 12, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Clients
                  </p>
                  {rows.length > 0 && (
                    <div style={{ padding: "2px 10px", borderRadius: 99, background: "rgba(246,110,18,0.15)", border: "1px solid rgba(246,110,18,0.25)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#FF9500" }}>{rows.length}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
                  <input
                    type="text"
                    placeholder="Search clients…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setFocused("search")}
                    onBlur={() => setFocused(null)}
                    style={{
                      padding: "8px 14px",
                      background: focused === "search" ? "#E2E8F0" : "#F1F5F9",
                      border: `1px solid ${focused === "search" ? "rgba(246,110,18,0.4)" : "#E2E8F0"}`,
                      borderRadius: 10, fontSize: 13, color: "#0F172A",
                      fontFamily: "'Inter', sans-serif",
                      outline: "none", minWidth: 0, flex: "1 1 140px", maxWidth: 220, transition: "all 0.2s",
                    }}
                  />
                  <button
                    onClick={() => void loadRows()}
                    disabled={loading || busy}
                    style={{
                      padding: "8px 14px",
                      background: "#F1F5F9", border: "1px solid #E2E8F0",
                      borderRadius: 10, fontSize: 13, fontWeight: 500, color: "#64748B",
                      cursor: loading || busy ? "not-allowed" : "pointer", transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", flexShrink: 0,
                    }}
                  >
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 12, height: 12, border: "2px solid rgba(15,23,42,0.2)", borderTopColor: "#0F172A", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        Loading
                      </span>
                    ) : "↻ Refresh"}
                  </button>
                  <button
                    onClick={openAdd}
                    disabled={busy}
                    style={{
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #F66E12, #FF9500)",
                      border: "none", borderRadius: 10,
                      fontSize: 13, fontWeight: 600, color: "#fff",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      cursor: busy ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 16px rgba(246,110,18,0.3)",
                      transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
                    }}
                  >
                    + Add Business
                  </button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                  <div style={{ width: 32, height: 32, border: "2px solid rgba(15,23,42,0.1)", borderTopColor: "#FF9500", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                        {["Business", "Slug", "Plan", "Status", "Owner Email", "Actions"].map((h) => (
                          <th key={h} style={{
                            padding: "12px 20px", textAlign: "left",
                            fontSize: 10, fontWeight: 600, color: "rgba(15,23,42,0.25)",
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
                            <p style={{ fontSize: 14, color: "rgba(15,23,42,0.2)" }}>
                              {search ? "No clients match your search." : "No businesses yet. Add one above."}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((b) => {
                          const url = origin ? `${origin}/review/${encodeURIComponent(b.custom_url_slug)}` : "";
                          const active = b.is_active !== false;
                          const pc = planColors[b.plan ?? "basic"] ?? "#94A3B8";
                          return (
                            <tr
                              key={b.id}
                              className="row-item"
                              style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}
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
                                  <span style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{b.name}</span>
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
                                <span style={{ fontSize: 13, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
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
                                    onClick={() => void openOfferModal(b)}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "#d97706",
                                      background: "rgba(245,158,11,0.08)", borderRadius: 7,
                                      border: "1px solid rgba(245,158,11,0.25)",
                                      padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >🎁 Offer</button>

                                  <button
                                    className="action-btn"
                                    onClick={() => openEdit(b)}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "#475569",
                                      background: "#F1F5F9", borderRadius: 7,
                                      border: "1px solid #E2E8F0",
                                      padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >Edit</button>

                                  <button
                                    className="action-btn"
                                    onClick={() => void downloadQr(b.id, "png")}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "#475569",
                                      background: "#F1F5F9", borderRadius: 7,
                                      border: "1px solid #E2E8F0",
                                      padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >QR PNG</button>

                                  <button
                                    className="action-btn"
                                    onClick={() => void downloadQr(b.id, "svg")}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "#475569",
                                      background: "#F1F5F9", borderRadius: 7,
                                      border: "1px solid #E2E8F0",
                                      padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
                                    }}
                                  >QR SVG</button>

                                  {url && (
                                    <button
                                      onClick={() => copyLink(url, b.id)}
                                      style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: copied === b.id ? "#22c55e" : "rgba(255,255,255,0.45)",
                                        background: copied === b.id ? "rgba(22,163,74,0.1)" : "#F1F5F9",
                                        borderRadius: 7,
                                        border: `1px solid ${copied === b.id ? "rgba(22,163,74,0.25)" : "rgba(15,23,42,0.08)"}`,
                                        padding: "4px 10px", cursor: "pointer", transition: "all 0.2s",
                                      }}
                                    >
                                      {copied === b.id ? "✓ Copied" : "Copy link"}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => void removeBusiness(b)}
                                    style={{
                                      fontSize: 11, fontWeight: 600, color: "#DC2626",
                                      background: "#FEE2E2", borderRadius: 7,
                                      border: "1px solid #FECACA",
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
            background: "#111116", border: "1px solid rgba(15,23,42,0.1)",
            borderRadius: 24, padding: 32,
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            maxHeight: "90vh", overflowY: "auto",
            animation: "fadeUp 0.25s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>
                  {modal === "add" ? "Add Business" : "Edit Business"}
                </h2>
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                  {modal === "add" ? "Create a new client account" : `Editing ${editing?.name}`}
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(15,23,42,0.06)", border: "1px solid #E2E8F0",
                  color: "#64748B", fontSize: 16, cursor: "pointer",
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
                    {label} {hint && <span style={{ color: "rgba(15,23,42,0.2)", textTransform: "none", fontWeight: 400 }}>{hint}</span>}
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
                    background: "#F1F5F9", border: "1px solid #E2E8F0",
                    borderRadius: 10, fontSize: 13, color: "#0F172A",
                    fontFamily: "'Inter', sans-serif", outline: "none", cursor: "pointer", appearance: "none",
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
                background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 12,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>Account active</p>
                  <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Review page will be publicly accessible</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  style={{
                    width: 44, height: 24, borderRadius: 99,
                    background: form.is_active ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(15,23,42,0.1)",
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
                background: "#F1F5F9", border: "1px solid #E2E8F0",
                borderRadius: 12, fontSize: 14, fontWeight: 500, color: "#64748B",
                cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
              }}>Cancel</button>
              <button
                onClick={() => void submitForm()}
                disabled={busy || !form.name.trim() || !form.place_id.trim()}
                style={{
                  flex: 2, padding: "13px",
                  background: busy || !form.name.trim() || !form.place_id.trim() ? "rgba(246,110,18,0.3)" : "linear-gradient(135deg, #F66E12, #FF9500)",
                  border: "none", borderRadius: 12,
                  fontSize: 14, fontWeight: 700,
                  color: busy || !form.name.trim() || !form.place_id.trim() ? "#64748B" : "#fff",
                  cursor: busy || !form.name.trim() || !form.place_id.trim() ? "not-allowed" : "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: busy || !form.name.trim() || !form.place_id.trim() ? "none" : "0 6px 24px rgba(246,110,18,0.4)",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {busy ? (
                  <>
                    <div style={{ width: 14, height: 14, border: "2px solid #64748B", borderTopColor: "#0F172A", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
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
            background: "#111116", border: "1px solid rgba(15,23,42,0.1)",
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
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>
                    Service Tags
                  </h2>
                  <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                    {tagsTarget.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(15,23,42,0.06)", border: "1px solid #E2E8F0",
                  color: "#64748B", fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>

            {/* ── Tab switcher ─────────────────────────────────────────────── */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 20,
              background: "#F1F5F9", borderRadius: 12, padding: 4,
            }}>
              {(["service", "category"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTagsActiveTab(tab)}
                  style={{
                    flex: 1, padding: "9px 14px", borderRadius: 9,
                    background: tagsActiveTab === tab ? "#fff" : "transparent",
                    border: tagsActiveTab === tab ? "1px solid #E2E8F0" : "1px solid transparent",
                    boxShadow: tagsActiveTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    fontSize: 13, fontWeight: 600,
                    color: tagsActiveTab === tab ? "#0F172A" : "#64748B",
                    cursor: "pointer", transition: "all 0.2s",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {tab === "service" ? "🏷️ Service Tags" : "📂 Category Tags"}
                </button>
              ))}
            </div>

            {tagsError && (
              <div style={{
                background: "#FEE2E2", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "#fca5a5",
              }}>⚠️ {tagsError}</div>
            )}

            {tagsBusy ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                <div style={{ width: 28, height: 28, border: "2px solid rgba(15,23,42,0.1)", borderTopColor: "#F66E12", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : (
              <>
                {/* ══ SERVICE TAGS TAB ══════════════════════════════════════ */}
                {tagsActiveTab === "service" && (
                  <>
                    <p style={{ fontSize: 12, color: "rgba(15,23,42,0.4)", marginBottom: 16, lineHeight: 1.6 }}>
                      These tags appear on the customer review page under &quot;What did you love?&quot; — customers tap them to give quick feedback.
                      If none are set, the <strong style={{ color: "#64748B" }}>Default Template</strong> is used.
                    </p>

                    {editingTags.length === 0 ? (
                      <div style={{
                        border: "1px dashed rgba(15,23,42,0.1)", borderRadius: 14,
                        padding: "32px 20px", textAlign: "center", marginBottom: 20,
                      }}>
                        <p style={{ fontSize: 24, marginBottom: 8 }}>🏷️</p>
                        <p style={{ fontSize: 13, color: "rgba(15,23,42,0.25)" }}>No service tags yet. Add some below.</p>
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
                              background: "#F1F5F9", border: "1px solid #E2E8F0",
                              borderRadius: 12,
                            }}
                          >
                            <input
                              value={tag.emoji}
                              onChange={e => setEditingTags(prev => prev.map(t => t.id === tag.id ? { ...t, emoji: e.target.value } : t))}
                              style={{ width: 40, textAlign: "center", fontSize: 18, background: "transparent", border: "none", outline: "none", cursor: "text", color: "#0F172A" }}
                              maxLength={4}
                            />
                            <input
                              value={tag.label}
                              onChange={e => setEditingTags(prev => prev.map(t => t.id === tag.id ? { ...t, label: e.target.value } : t))}
                              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#0F172A", fontFamily: "'Inter', sans-serif" }}
                            />
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => moveTag(tag.id, -1)} disabled={idx === 0} style={{ width: 26, height: 26, borderRadius: 6, background: "#F1F5F9", border: "1px solid #E2E8F0", color: idx === 0 ? "rgba(15,23,42,0.15)" : "#64748B", fontSize: 12, cursor: idx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                              <button onClick={() => moveTag(tag.id, 1)} disabled={idx === editingTags.length - 1} style={{ width: 26, height: 26, borderRadius: 6, background: "#F1F5F9", border: "1px solid #E2E8F0", color: idx === editingTags.length - 1 ? "rgba(15,23,42,0.15)" : "#64748B", fontSize: 12, cursor: idx === editingTags.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>
                            </div>
                            <button onClick={() => removeTag(tag.id)} style={{ width: 26, height: 26, borderRadius: 6, background: "#FEE2E2", border: "1px solid #FECACA", color: "rgba(239,68,68,0.7)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new service tag */}
                    <div style={{ background: "rgba(246,110,18,0.05)", border: "1px solid rgba(246,110,18,0.15)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(246,110,18,0.8)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Add New Tag</p>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input
                          value={newTagEmoji}
                          onChange={e => setNewTagEmoji(e.target.value)}
                          maxLength={4}
                          placeholder="😊"
                          style={{ width: 52, textAlign: "center", fontSize: 20, padding: "10px 6px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, color: "#0F172A", outline: "none" }}
                        />
                        <input
                          value={newTagLabel}
                          onChange={e => setNewTagLabel(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addTag()}
                          placeholder="Tag label, e.g. Great Coffee"
                          style={{ flex: 1, padding: "11px 14px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, color: "#0F172A", fontFamily: "'Inter', sans-serif", outline: "none" }}
                        />
                    <button
                          onClick={addTag}
                          disabled={!newTagLabel.trim()}
                          style={{
                            padding: "11px 18px",
                            background: newTagLabel.trim() ? "linear-gradient(135deg,#FF9500,#F66E12)" : "rgba(246,110,18,0.15)",
                            border: "none", borderRadius: 10,
                            color: newTagLabel.trim() ? "#fff" : "#64748B",
                            fontSize: 13, fontWeight: 600, cursor: newTagLabel.trim() ? "pointer" : "not-allowed",
                            fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap",
                          }}
                        >+ Add</button>
                      </div>
                      {/* Quick suggestions */}
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: 10, color: "rgba(15,23,42,0.2)", marginBottom: 8 }}>QUICK ADD:</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {DEFAULT_TAG_SUGGESTIONS.filter(s => !editingTags.some(t => t.label === s.label)).slice(0, 8).map(s => (
                            <button
                              key={s.id}
                              onClick={() => setEditingTags(prev => [...prev, { ...s, id: uid() }])}
                              style={{ padding: "4px 10px", borderRadius: 99, background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#64748B", fontSize: 11, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                            >
                              {s.emoji} {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ══ CATEGORY TAGS TAB ════════════════════════════════════ */}
                {tagsActiveTab === "category" && (
                  <>
                    <p style={{ fontSize: 12, color: "rgba(15,23,42,0.4)", marginBottom: 16, lineHeight: 1.6 }}>
                      Category tags let customers describe their experience in broader terms — e.g. &quot;Good People&quot;, &quot;Good Place&quot;. Add the categories you want to offer here.
                    </p>

                    {editingCategoryTags.length === 0 ? (
                      <div style={{ border: "1px dashed rgba(15,23,42,0.1)", borderRadius: 14, padding: "32px 20px", textAlign: "center", marginBottom: 20 }}>
                        <p style={{ fontSize: 24, marginBottom: 8 }}>📂</p>
                        <p style={{ fontSize: 13, color: "rgba(15,23,42,0.25)" }}>No category tags yet. Add some below.</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                        {editingCategoryTags.map((tag, idx) => (
                          <div
                            key={tag.id}
                            className="tag-chip"
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 12 }}
                          >
                            <input
                              value={tag.emoji}
                              onChange={e => setEditingCategoryTags(prev => prev.map(t => t.id === tag.id ? { ...t, emoji: e.target.value } : t))}
                              style={{ width: 40, textAlign: "center", fontSize: 18, background: "transparent", border: "none", outline: "none", cursor: "text", color: "#0F172A" }}
                              maxLength={4}
                            />
                            <input
                              value={tag.label}
                              onChange={e => setEditingCategoryTags(prev => prev.map(t => t.id === tag.id ? { ...t, label: e.target.value } : t))}
                              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#0F172A", fontFamily: "'Inter', sans-serif" }}
                            />
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => moveCategoryTag(tag.id, -1)} disabled={idx === 0} style={{ width: 26, height: 26, borderRadius: 6, background: "#F1F5F9", border: "1px solid #E2E8F0", color: idx === 0 ? "rgba(15,23,42,0.15)" : "#64748B", fontSize: 12, cursor: idx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                              <button onClick={() => moveCategoryTag(tag.id, 1)} disabled={idx === editingCategoryTags.length - 1} style={{ width: 26, height: 26, borderRadius: 6, background: "#F1F5F9", border: "1px solid #E2E8F0", color: idx === editingCategoryTags.length - 1 ? "rgba(15,23,42,0.15)" : "#64748B", fontSize: 12, cursor: idx === editingCategoryTags.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>
                            </div>
                            <button onClick={() => removeCategoryTag(tag.id)} style={{ width: 26, height: 26, borderRadius: 6, background: "#FEE2E2", border: "1px solid #FECACA", color: "rgba(239,68,68,0.7)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new category tag */}
                    <div style={{ background: "rgba(246,110,18,0.05)", border: "1px solid rgba(246,110,18,0.15)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(246,110,18,0.8)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Add New Category</p>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input
                          value={newCategoryEmoji}
                          onChange={e => setNewCategoryEmoji(e.target.value)}
                          maxLength={4}
                          placeholder="🏷️"
                          style={{ width: 52, textAlign: "center", fontSize: 20, padding: "10px 6px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, color: "#0F172A", outline: "none" }}
                        />
                        <input
                          value={newCategoryLabel}
                          onChange={e => setNewCategoryLabel(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addCategoryTag()}
                          placeholder="e.g. Good People, Good Place"
                          style={{ flex: 1, padding: "11px 14px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, color: "#0F172A", fontFamily: "'Inter', sans-serif", outline: "none" }}
                        />
                        <button
                          onClick={addCategoryTag}
                          disabled={!newCategoryLabel.trim()}
                          style={{
                            padding: "11px 18px",
                            background: newCategoryLabel.trim() ? "linear-gradient(135deg,#FF9500,#F66E12)" : "rgba(246,110,18,0.15)",
                            border: "none", borderRadius: 10,
                            color: newCategoryLabel.trim() ? "#fff" : "#64748B",
                            fontSize: 13, fontWeight: 600, cursor: newCategoryLabel.trim() ? "pointer" : "not-allowed",
                            fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap",
                          }}
                        >+ Add</button>
                      </div>
                      {/* Category quick suggestions */}
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: 10, color: "rgba(15,23,42,0.2)", marginBottom: 8 }}>QUICK ADD:</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {[
                            { emoji: "👥", label: "Good People" },
                            { emoji: "📍", label: "Good Place" },
                            { emoji: "🌟", label: "Great Experience" },
                            { emoji: "💎", label: "Premium Quality" },
                            { emoji: "🤝", label: "Trustworthy" },
                            { emoji: "🎯", label: "Reliable" },
                          ].filter(s => !editingCategoryTags.some(t => t.label === s.label)).map(s => (
                            <button
                              key={s.label}
                              onClick={() => setEditingCategoryTags(prev => [...prev, { id: uid(), label: s.label, emoji: s.emoji }])}
                              style={{ padding: "4px 10px", borderRadius: 99, background: "#F1F5F9", border: "1px solid #E2E8F0", color: "#64748B", fontSize: 11, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                            >
                              {s.emoji} {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setModal(null)} style={{
                    flex: 1, padding: "13px",
                    background: "#F1F5F9", border: "1px solid #E2E8F0",
                    borderRadius: 12, fontSize: 14, fontWeight: 500, color: "#64748B",
                    cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  }}>Cancel</button>
                  <button
                    onClick={() => void saveTags()}
                    disabled={tagsBusy}
                    style={{
                      flex: 2, padding: "13px",
                      background: tagsBusy ? "rgba(246,110,18,0.2)" : "linear-gradient(135deg,#FF9500,#F66E12)",
                      border: "none", borderRadius: 12,
                      fontSize: 14, fontWeight: 700, color: tagsBusy ? "#64748B" : "#fff",
                      cursor: tagsBusy ? "not-allowed" : "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      boxShadow: tagsBusy ? "none" : "0 6px 24px rgba(246,110,18,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {tagsBusy ? (
                      <>
                        <div style={{ width: 14, height: 14, border: "2px solid #64748B", borderTopColor: "#0F172A", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
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
            background: "#111116", border: "1px solid rgba(15,23,42,0.1)",
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
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>
                    Default Tags Template
                  </h2>
                  <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                    Used when a business has no custom tags set
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(15,23,42,0.06)", border: "1px solid #E2E8F0",
                  color: "#64748B", fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>

            <p style={{ fontSize: 12, color: "rgba(15,23,42,0.25)", marginBottom: 24, lineHeight: 1.6 }}>
              This template is shown on the review page for any business that doesn&apos;t have custom tags set. You can override these per-business using the <strong style={{ color: "#64748B" }}>🏷️ Tags</strong> button on each row.
            </p>

            {/* Default tags list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {defaultTags.map((tag) => (
                <div key={tag.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  background: "#F1F5F9", border: "1px solid #E2E8F0",
                  borderRadius: 12,
                }}>
                  <input
                    value={tag.emoji}
                    onChange={e => setDefaultTags(prev => prev.map(t => t.id === tag.id ? { ...t, emoji: e.target.value } : t))}
                    style={{ width: 40, textAlign: "center", fontSize: 18, background: "transparent", border: "none", outline: "none", color: "#0F172A" }}
                    maxLength={4}
                  />
                  <input
                    value={tag.label}
                    onChange={e => setDefaultTags(prev => prev.map(t => t.id === tag.id ? { ...t, label: e.target.value } : t))}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#0F172A", fontFamily: "'Inter', sans-serif" }}
                  />
                  <button
                    onClick={() => removeDefaultTag(tag.id)}
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      background: "#FEE2E2", border: "1px solid #FECACA",
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
                    background: "#F1F5F9", border: "1px solid #E2E8F0",
                    borderRadius: 10, color: "#0F172A", outline: "none",
                  }}
                />
                <input
                  value={newDefaultLabel}
                  onChange={e => setNewDefaultLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addDefaultTag()}
                  placeholder="Tag label"
                  style={{
                    flex: 1, padding: "11px 14px",
                    background: "#F1F5F9", border: "1px solid #E2E8F0",
                    borderRadius: 10, fontSize: 13, color: "#0F172A",
                    fontFamily: "'Inter', sans-serif", outline: "none",
                  }}
                />
                <button
                  onClick={addDefaultTag}
                  disabled={!newDefaultLabel.trim()}
                  style={{
                    padding: "11px 18px",
                    background: newDefaultLabel.trim() ? "linear-gradient(135deg,#F66E12,#FF9500)" : "rgba(246,110,18,0.15)",
                    border: "none", borderRadius: 10,
                    color: newDefaultLabel.trim() ? "#fff" : "#64748B",
                    fontSize: 13, fontWeight: 600, cursor: newDefaultLabel.trim() ? "pointer" : "not-allowed",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >+ Add</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModal(null)} style={{
                flex: 1, padding: "13px",
                background: "#F1F5F9", border: "1px solid #E2E8F0",
                borderRadius: 12, fontSize: 14, fontWeight: 500, color: "#64748B",
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>Cancel</button>
              <button
                onClick={saveDefaultTags}
                style={{
                  flex: 2, padding: "13px",
                  background: "linear-gradient(135deg,#F66E12,#FF9500)",
                  border: "none", borderRadius: 12,
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 6px 24px rgba(246,110,18,0.35)",
                }}
              >Save Template →</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Offer per business ════════════════════════════════════════ */}
      {modal === "offer" && offerTarget && (
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
            background: "#111116", border: "1px solid rgba(15,23,42,0.1)",
            borderRadius: 24, padding: 32,
            boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            maxHeight: "92vh", overflowY: "auto",
            animation: "fadeUp 0.25s ease both",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎁</div>
                <div>
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>
                    5-Star Reward Offers
                  </h2>
                  <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{offerTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(15,23,42,0.06)", border: "1px solid #E2E8F0", color: "#64748B", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <p style={{ fontSize: 12, color: "rgba(15,23,42,0.4)", marginBottom: 20, lineHeight: 1.6 }}>
              Add multiple offers — one will be picked <strong style={{ color: "#64748B" }}>randomly</strong> and shown to customers who leave a 5-star review.
            </p>

            {offerError && (
              <div style={{ background: "#FEE2E2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#fca5a5" }}>⚠️ {offerError}</div>
            )}

            {offerBusy ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                <div style={{ width: 28, height: 28, border: "2px solid rgba(15,23,42,0.1)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : (
              <>
                {/* ── Saved offers list ─────────────────────────────────── */}
                {offers.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Saved Offers ({offers.length})
                    </p>
                    {offers.map((o, idx) => (
                      <div key={idx} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px",
                        background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
                        border: "1px solid #fcd34d", borderRadius: 12,
                      }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{o.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#78350f", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</p>
                          {o.code && <p style={{ fontSize: 11, color: "#b45309", fontFamily: "monospace", letterSpacing: "0.08em" }}>🏷️ {o.code}{o.expiry ? ` · ⏰ ${o.expiry}` : ""}</p>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <div style={{ padding: "3px 8px", borderRadius: 99, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309" }}>#{idx + 1}</span>
                          </div>
                          <button
                            onClick={() => removeOfferAt(idx)}
                            style={{ width: 26, height: 26, borderRadius: 6, background: "#FEE2E2", border: "1px solid #FECACA", color: "rgba(239,68,68,0.7)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {offers.length === 0 && (
                  <div style={{ border: "1px dashed rgba(245,158,11,0.3)", borderRadius: 14, padding: "24px 20px", textAlign: "center", marginBottom: 20 }}>
                    <p style={{ fontSize: 22, marginBottom: 6 }}>🎁</p>
                    <p style={{ fontSize: 13, color: "rgba(15,23,42,0.3)" }}>No offers yet. Add one below.</p>
                  </div>
                )}

                {/* ── Add new offer form ────────────────────────────────── */}
                <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,158,11,0.9)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
                    {offers.length === 0 ? "Add First Offer" : "Add Another Offer"}
                  </p>

                  {/* Emoji + Title */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Icon</label>
                      <input
                        value={offerDraft.emoji}
                        onChange={e => setOfferDraft(f => ({ ...f, emoji: e.target.value }))}
                        maxLength={4}
                        style={{ width: 52, textAlign: "center", fontSize: 20, padding: "9px 4px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, color: "#0F172A", outline: "none" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Offer Title *</label>
                      <input
                        value={offerDraft.title}
                        onChange={e => setOfferDraft(f => ({ ...f, title: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addOfferToDraft()}
                        placeholder="e.g. 10% Off Your Next Visit"
                        style={{ width: "100%", padding: "10px 12px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, color: "#0F172A", fontFamily: "'Inter', sans-serif", outline: "none" }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Description</label>
                    <textarea
                      value={offerDraft.description}
                      onChange={e => setOfferDraft(f => ({ ...f, description: e.target.value }))}
                      placeholder="e.g. Show this screen at the counter to redeem."
                      rows={2}
                      style={{ width: "100%", padding: "10px 12px", resize: "none", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, color: "#0F172A", fontFamily: "'Inter', sans-serif", outline: "none" }}
                    />
                  </div>

                  {/* Code + Expiry */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Promo Code</label>
                      <input
                        value={offerDraft.code}
                        onChange={e => setOfferDraft(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        placeholder="e.g. THANKS10"
                        style={{ width: "100%", padding: "10px 12px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, color: "#0F172A", fontFamily: "monospace", outline: "none", letterSpacing: "0.08em" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Valid Until</label>
                      <input
                        value={offerDraft.expiry}
                        onChange={e => setOfferDraft(f => ({ ...f, expiry: e.target.value }))}
                        placeholder="e.g. Dec 31, 2025"
                        style={{ width: "100%", padding: "10px 12px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13, color: "#0F172A", fontFamily: "'Inter', sans-serif", outline: "none" }}
                      />
                    </div>
                  </div>

                  {/* Mini preview */}
                  {offerDraft.title && (
                    <div style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fcd34d", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Preview</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: offerDraft.description ? 6 : 0 }}>
                        <span style={{ fontSize: 16 }}>{offerDraft.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#78350f" }}>{offerDraft.title}</span>
                      </div>
                      {offerDraft.description && <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.4, marginBottom: offerDraft.code ? 6 : 0 }}>{offerDraft.description}</p>}
                      {offerDraft.code && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "rgba(255,255,255,0.7)", border: "1.5px dashed #fcd34d", borderRadius: 8 }}>
                          <span style={{ fontSize: 11 }}>🏷️</span>
                          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", color: "#78350f", fontFamily: "monospace" }}>{offerDraft.code}</span>
                        </div>
                      )}
                      {offerDraft.expiry && <p style={{ fontSize: 11, color: "#b45309", marginTop: 6 }}>⏰ Valid until: <strong>{offerDraft.expiry}</strong></p>}
                    </div>
                  )}

                  <button
                    onClick={addOfferToDraft}
                    disabled={!offerDraft.title.trim()}
                    style={{
                      width: "100%", padding: "11px",
                      background: offerDraft.title.trim() ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "rgba(245,158,11,0.15)",
                      border: "none", borderRadius: 10,
                      fontSize: 13, fontWeight: 700,
                      color: offerDraft.title.trim() ? "#78350f" : "#64748B",
                      cursor: offerDraft.title.trim() ? "pointer" : "not-allowed",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >+ Add to List</button>
                </div>

                {/* Save / Cancel */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setModal(null)} style={{ flex: 1, padding: "13px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 14, fontWeight: 500, color: "#64748B", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                  <button
                    onClick={() => void saveOffers()}
                    disabled={offerBusy}
                    style={{
                      flex: 2, padding: "13px",
                      background: offerBusy ? "rgba(245,158,11,0.2)" : "linear-gradient(135deg,#f59e0b,#fbbf24)",
                      border: "none", borderRadius: 12,
                      fontSize: 14, fontWeight: 700,
                      color: offerBusy ? "#64748B" : "#78350f",
                      cursor: offerBusy ? "not-allowed" : "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      boxShadow: offerBusy ? "none" : "0 6px 24px rgba(245,158,11,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {offerBusy ? (
                      <><div style={{ width: 14, height: 14, border: "2px solid #64748B", borderTopColor: "#78350f", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Saving…</>
                    ) : `Save ${offers.length} Offer${offers.length !== 1 ? "s" : ""} →`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
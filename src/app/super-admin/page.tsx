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

function authHeaders(secret: string): HeadersInit {
  return { Authorization: `Bearer ${secret}` };
}

export default function SuperAdminPage() {
  const [secret, setSecret] = useState("");
  const [secretSaved, setSecretSaved] = useState(false);
  const [rows, setRows] = useState<BusinessRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  const [modal, setModal] = useState<"add" | "edit" | null>(null);
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

  useEffect(() => {
    setOrigin(window.location.origin);
    const s = sessionStorage.getItem(STORAGE_KEY);
    if (s) {
      setSecret(s);
      setSecretSaved(true);
    }
  }, []);

  const canCall = useMemo(() => secret.trim().length > 0, [secret]);

  const loadRows = useCallback(async () => {
    if (!canCall) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/businesses", { headers: authHeaders(secret.trim()) });
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

  useEffect(() => {
    if (secretSaved && canCall) void loadRows();
  }, [secretSaved, canCall, loadRows]);

  function persistSecret() {
    sessionStorage.setItem(STORAGE_KEY, secret.trim());
    setSecretSaved(true);
    void loadRows();
  }

  function openAdd() {
    setEditing(null);
    setForm({
      name: "",
      custom_url_slug: "",
      place_id: "",
      logo_url: "",
      owner_email: "",
      plan: "basic",
      is_active: true,
    });
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
    if (!confirm(`Delete “${b.name}”? This cannot be undone.`)) return;
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

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage clients, Google Place IDs, activation, and QR codes (ReviewFlow project brief).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
            >
              Legacy analytics (all data)
            </Link>
            <Link href="/" className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
              Home
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Admin API access</p>
          <p className="mt-1 text-xs text-gray-500">
            Set <code className="rounded bg-gray-100 px-1">REVIEWFLOW_SUPER_ADMIN_SECRET</code> and{" "}
            <code className="rounded bg-gray-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> on the server. Paste the same
            secret here (stored in sessionStorage for this browser only).
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="password"
              autoComplete="off"
              placeholder="Super admin secret"
              className="w-full flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <button
              type="button"
              onClick={persistSecret}
              disabled={!secret.trim()}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Save &amp; load clients
            </button>
          </div>
        </div>

        {secretSaved && canCall ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadRows()}
              disabled={loading || busy}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={openAdd}
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Add business
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
        ) : null}

        {secretSaved && canCall ? (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Clients</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                      <th className="px-4 py-3 font-semibold">Business</th>
                      <th className="px-4 py-3 font-semibold">Slug</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Active</th>
                      <th className="px-4 py-3 font-semibold">Owner</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                          No businesses yet. Add one above.
                        </td>
                      </tr>
                    ) : (
                      rows.map((b) => {
                        const url = origin ? `${origin}/review/${encodeURIComponent(b.custom_url_slug)}` : "";
                        const active = b.is_active !== false;
                        return (
                          <tr key={b.id} className="border-b border-gray-50 last:border-0">
                            <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.custom_url_slug}</td>
                            <td className="px-4 py-3 text-gray-600">{b.plan ?? "basic"}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void toggleActive(b)}
                                className={
                                  active
                                    ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                                    : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                                }
                              >
                                {active ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td className="max-w-[160px] truncate px-4 py-3 text-gray-600" title={b.owner_email ?? ""}>
                              {b.owner_email ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                <Link
                                  href={`/review/${b.custom_url_slug}`}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                  Open
                                </Link>
                                <Link
                                  href={`/admin/${b.id}`}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                  Analytics
                                </Link>
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-gray-700 hover:text-gray-900"
                                  onClick={() => openEdit(b)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-gray-700 hover:text-gray-900"
                                  onClick={() => void downloadQr(b.id, "png")}
                                >
                                  QR PNG
                                </button>
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-gray-700 hover:text-gray-900"
                                  onClick={() => void downloadQr(b.id, "svg")}
                                >
                                  QR SVG
                                </button>
                                {url ? (
                                  <button
                                    type="button"
                                    className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                                    onClick={() => void navigator.clipboard.writeText(url)}
                                  >
                                    Copy link
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-red-600 hover:text-red-800"
                                  onClick={() => void removeBusiness(b)}
                                >
                                  Delete
                                </button>
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
        ) : null}

        {modal ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-gray-900">{modal === "add" ? "Add business" : "Edit business"}</h2>
              <div className="mt-4 space-y-3 text-sm">
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500">Name *</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500">URL slug (optional, auto from name)</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs outline-none focus:border-gray-400"
                    value={form.custom_url_slug}
                    onChange={(e) => setForm((f) => ({ ...f, custom_url_slug: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500">Google Place ID *</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs outline-none focus:border-gray-400"
                    value={form.place_id}
                    onChange={(e) => setForm((f) => ({ ...f, place_id: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500">Logo URL</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                    value={form.logo_url}
                    onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500">Owner email (dashboard login)</span>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                    value={form.owner_email}
                    onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500">Plan</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                    value={form.plan}
                    onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                  >
                    <option value="basic">basic</option>
                    <option value="pro">pro</option>
                    <option value="enterprise">enterprise</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Account active (review page live)</span>
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy || !form.name.trim() || !form.place_id.trim()}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  onClick={() => void submitForm()}
                >
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

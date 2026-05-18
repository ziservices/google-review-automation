"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    router.push("/dashboard");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0C0C0C !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #1C1C1C inset !important;
          -webkit-text-fill-color: #E7E7E7 !important;
        }
      `}</style>

      <main style={{
        minHeight: "100vh",
        background: "#0C0C0C",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px", position: "relative", overflow: "hidden",
      }}>

        {/* Background grid */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(rgba(246,110,18,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(246,110,18,0.04) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />

        {/* Glow */}
        <div style={{
          position: "fixed", top: "30%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(246,110,18,0.1) 0%, transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "fadeUp 0.5s ease both" }}>

          {/* Logo */}
          <div style={{ marginBottom: 40, textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: "linear-gradient(135deg, #FF9500, #FF0000)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 32px rgba(246,110,18,0.4)",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
              color: "#E7E7E7", letterSpacing: "-0.04em", marginBottom: 8,
            }}>
              ReviewFlow
            </h1>
            <p style={{ fontSize: 14, color: "#A0A0A0", fontWeight: 300 }}>
              Sign in to your business dashboard
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: "#1C1C1C",
            border: "1px solid rgba(246,110,18,0.15)",
            borderRadius: 24, padding: "32px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(246,110,18,0.08)",
          }}>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 12, padding: "10px 14px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <p style={{ fontSize: 13, color: "#fca5a5" }}>{error}</p>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 600,
                color: "#A0A0A0", marginBottom: 8,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>Email</label>
              <input
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%", padding: "14px 16px",
                  background: focused === "email" ? "rgba(246,110,18,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${focused === "email" ? "rgba(246,110,18,0.5)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 12, fontSize: 14, color: "#E7E7E7",
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none", transition: "all 0.2s",
                  boxShadow: focused === "email" ? "0 0 0 3px rgba(246,110,18,0.12)" : "none",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 600,
                color: "#A0A0A0", marginBottom: 8,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused(null)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%", padding: "14px 16px",
                  background: focused === "pass" ? "rgba(246,110,18,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${focused === "pass" ? "rgba(246,110,18,0.5)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 12, fontSize: 14, color: "#E7E7E7",
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none", transition: "all 0.2s",
                  boxShadow: focused === "pass" ? "0 0 0 3px rgba(246,110,18,0.12)" : "none",
                }}
              />
            </div>

            {/* Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%", padding: "15px",
                background: loading
                  ? "rgba(246,110,18,0.3)"
                  : "linear-gradient(135deg, #FF9500, #FF0000)",
                border: "none", borderRadius: 14,
                color: "#fff", fontSize: 15, fontWeight: 700,
                fontFamily: "'Syne', sans-serif", letterSpacing: "-0.01em",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 8px 32px rgba(246,110,18,0.45)",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(246,110,18,0.55)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = loading ? "none" : "0 8px 32px rgba(246,110,18,0.45)"; }}
            >
              {loading
                ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Signing in...</>
                : "Sign in to Dashboard →"
              }
            </button>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: 12, color: "#A0A0A0", marginTop: 24, opacity: 0.6 }}>
            🔒 Secure login — powered by ReviewFlow
          </p>
        </div>
      </main>
    </>
  );
}
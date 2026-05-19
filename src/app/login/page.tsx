"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

// ── Brand tokens ────────────────────────────────────────────────────────────
const T = {
  primary:   "#F66E12",
  gradStart: "#FF9500",
  gradEnd:   "#FF0000",
  bg:        "#F7F7F7",
  white:     "#FFFFFF",
  border:    "#E4E4E4",
  textPri:   "#1C1C1C",
  textSec:   "#A0A0A0",
  inputBg:   "#F0F0F0",
  shadow:    "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
  shadowLg:  "0 8px 40px rgba(0,0,0,0.10)",
  orangeGlow:"0 8px 32px rgba(246,110,18,0.30)",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    router.push("/dashboard");
  };

  const fieldStyle = (key: string): React.CSSProperties => ({
    width: "100%", padding: "13px 16px",
    background: focused === key ? T.white : T.inputBg,
    border: `1.5px solid ${focused === key ? T.primary : T.border}`,
    borderRadius: 12, fontSize: 14, color: T.textPri,
    fontFamily: "'Inter', sans-serif", outline: "none",
    transition: "all 0.18s",
    boxShadow: focused === key ? `0 0 0 3px rgba(246,110,18,0.12)` : "none",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg} !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%,100% { opacity:.6; } 50% { opacity:1; } }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px ${T.white} inset !important;
          -webkit-text-fill-color: ${T.textPri} !important;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(246,110,18,0.45) !important;
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <main style={{
        minHeight: "100vh", background: T.bg,
        display: "flex", fontFamily: "'Inter', sans-serif",
        position: "relative", overflow: "hidden",
      }}>

        {/* ── Left decorative panel ── */}
        <div style={{
          display: "none",
          position: "relative", overflow: "hidden",
        }} className="left-panel" />

        {/* ── Subtle dot grid bg ── */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          backgroundImage: `radial-gradient(circle, #D7D7D7 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          opacity: 0.6,
        }} />

        {/* ── Orange glow top-right ── */}
        <div style={{
          position: "fixed", top: "-10%", right: "-5%",
          width: 500, height: 500, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(246,110,18,0.12) 0%, transparent 65%)`,
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", bottom: "-15%", left: "-5%",
          width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,149,0,0.08) 0%, transparent 65%)`,
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* ── Card ── */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "32px 16px", position: "relative", zIndex: 1,
        }}>
          <div style={{
            width: "100%", maxWidth: 440,
            animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
          }}>

            {/* Logo block */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 18px",
                boxShadow: T.orangeGlow,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 30, fontWeight: 800, color: T.textPri,
                letterSpacing: "-0.04em", marginBottom: 6,
              }}>ReviewFlow</h1>
              <p style={{ fontSize: 14, color: T.textSec, fontWeight: 400 }}>
                Sign in to your business dashboard
              </p>
            </div>

            {/* Form card */}
            <div style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 24, padding: "36px 32px",
              boxShadow: T.shadowLg,
            }}>

              {/* Error banner */}
              {error && (
                <div style={{
                  background: "#FFF1F0", border: "1px solid #FFCCC7",
                  borderRadius: 10, padding: "11px 14px", marginBottom: 22,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 15 }}>⚠️</span>
                  <p style={{ fontSize: 13, color: "#CF1322", fontWeight: 500 }}>{error}</p>
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 600,
                  color: T.textSec, marginBottom: 7,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                }}>Email address</label>
                <input
                  type="email" placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={fieldStyle("email")}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <label style={{
                    fontSize: 11, fontWeight: 600, color: T.textSec,
                    letterSpacing: "0.07em", textTransform: "uppercase",
                  }}>Password</label>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"} placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={{ ...fieldStyle("pass"), paddingRight: 44 }}
                  />
                  <button
                    type="button" onClick={() => setShowPass(v => !v)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: T.textSec, fontSize: 16, padding: 0, lineHeight: 1,
                    }}
                  >{showPass ? "🙈" : "👁"}</button>
                </div>
              </div>

              {/* CTA */}
              <button
                className="login-btn"
                onClick={handleLogin} disabled={loading}
                style={{
                  width: "100%", padding: "15px",
                  background: loading
                    ? `rgba(246,110,18,0.35)`
                    : `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`,
                  border: "none", borderRadius: 14,
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: "-0.01em",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : T.orangeGlow,
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Signing in…
                  </>
                ) : "Sign in to Dashboard →"}
              </button>
            </div>

            {/* Footer */}
            <p style={{ textAlign: "center", fontSize: 12, color: T.textSec, marginTop: 24 }}>
              🔒 Secured by ReviewFlow · Enterprise-grade auth
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dumbbell, Sparkles, ChefHat, Target, ArrowRight, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "FIT PRO — Calcule suas metas e descubra receitas premium" },
      { name: "description", content: "Plano nutricional inteligente, 60+ receitas fit e acompanhamento de macros em tempo real." },
    ],
  }),
});

function Landing() {
  const { session, loading } = useSession();
  const nav = useNavigate();
  useEffect(() => { if (!loading && session) nav({ to: "/app" }); }, [session, loading, nav]);

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) { setErr(e.message ?? "Erro inesperado"); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <header style={{
        background: "var(--gradient-hero)", color: "white", padding: "72px 24px 60px",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top, oklch(0.74 0.19 150 / 0.25), transparent 60%)" }} />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <span className="chip" style={{ background: "color-mix(in oklab, white 12%, transparent)", color: "white", borderColor: "color-mix(in oklab, white 24%, transparent)" }}>
            <Sparkles size={14} /> Nutrição inteligente
          </span>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.05, margin: "20px 0 14px", letterSpacing: "-0.02em" }}>
            Seu plano <span style={{ color: "oklch(0.85 0.18 150)" }}>FIT PRO</span><br />começa hoje.
          </h1>
          <p style={{ fontSize: 17, opacity: 0.85, maxWidth: 520, margin: "0 auto" }}>
            Calcule suas metas, descubra 60+ receitas premium e acompanhe seus macros em tempo real.
          </p>
        </div>
      </header>

      {/* Auth + Features */}
      <main style={{ flex: 1, padding: "48px 24px", maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr", gap: 40 }}>
        <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[
            { Icon: Target, title: "Metas calculadas", desc: "BMR, TDEE e macros sob medida." },
            { Icon: ChefHat, title: "60+ receitas", desc: "Bulk, cut e manter — escolha sua." },
            { Icon: Dumbbell, title: "Pré e pós-treino", desc: "Receitas otimizadas para performance." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="card" style={{ padding: 22 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--gp)", color: "var(--gd)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={22} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{title}</h3>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>{desc}</p>
            </div>
          ))}
        </section>

        <section className="card" style={{ padding: 32, maxWidth: 460, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--bg)", padding: 4, borderRadius: 12, marginBottom: 22 }}>
            {(["signup", "login"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: mode === m ? "white" : "transparent",
                color: mode === m ? "var(--ink)" : "var(--muted)",
                fontWeight: 700, fontSize: 14,
                boxShadow: mode === m ? "var(--shadow-sm)" : "none",
              }}>{m === "signup" ? "Criar conta" : "Entrar"}</button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            {mode === "signup" && (
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Nome</span>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Como podemos te chamar?" required />
              </label>
            )}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Email</span>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)" }} />
                <input className="input" style={{ paddingLeft: 40 }} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Senha</span>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)" }} />
                <input className="input" style={{ paddingLeft: 40 }} type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </label>
            {err && <div style={{ background: "oklch(0.96 0.05 25)", color: "oklch(0.45 0.18 25)", padding: 10, borderRadius: 10, fontSize: 13 }}>{err}</div>}
            <button className="btn-primary" type="submit" disabled={busy} style={{ marginTop: 6 }}>
              {busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"} <ArrowRight size={16} />
            </button>
            {mode === "signup" && (
              <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>
                Você receberá um email para confirmar sua conta.
              </p>
            )}
          </form>
        </section>
      </main>

      <footer style={{ padding: "28px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13, borderTop: "1px solid var(--border)" }}>
        © FIT PRO — Chef Leonardo Ferrari · <Link to="/" style={{ color: "var(--gd)" }}>FIT PRO</Link>
      </footer>
    </div>
  );
}

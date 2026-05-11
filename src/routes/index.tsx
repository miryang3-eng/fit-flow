import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Dumbbell, Sparkles, ChefHat, Target, ArrowRight, Mail, Lock, User, CheckCircle2, Flame, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "FIT PRO — Plano nutricional inteligente + 80 receitas premium" },
      { name: "description", content: "Calcule suas metas, descubra 80+ receitas fit e acompanhe seus macros em tempo real. Criado pelo Chef Leonardo Ferrari." },
    ],
  }),
});

const FEATURES = [
  { Icon: Target,   color: "var(--g)",    bg: "var(--gp)",    title: "Metas calculadas",   desc: "BMR, TDEE e macros sob medida para o seu corpo." },
  { Icon: ChefHat,  color: "#D97706",     bg: "#FEF9EC",      title: "80+ receitas fit",   desc: "Café, almoço, jantar, lanche, pré e pós-treino." },
  { Icon: Dumbbell, color: "#2563EB",     bg: "#EFF6FF",      title: "Pré e pós-treino",   desc: "Refeições otimizadas para performance e recovery." },
  { Icon: Flame,    color: "#DC2626",     bg: "#FEF2F2",      title: "Track de proteína",  desc: "Registre o que comeu e veja o progresso do dia." },
  { Icon: Trophy,   color: "#7C3AED",     bg: "#F5F3FF",      title: "Favoritos",          desc: "Salve suas receitas preferidas para acessar rápido." },
  { Icon: Zap,      color: "#EA580C",     bg: "#FFF7ED",      title: "Funciona offline",   desc: "PWA — instale no celular como um app de verdade." },
];

const STATS = [
  { value: "80+", label: "receitas fit" },
  { value: "100%", label: "calculado" },
  { value: "grátis", label: "para sempre" },
];

function Orb({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", ...style }} />;
}

function Landing() {
  const { session, loading } = useSession();
  const nav = useNavigate();
  useEffect(() => { if (!loading && session) nav({ to: "/app" }); }, [session, loading, nav]);

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e.message ?? "Erro inesperado");
    } finally {
      setBusy(false);
    }
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", fontFamily: "var(--font-sans)", background: "var(--bg)" }}>

      {/* ── Hero ── */}
      <header style={{
        position: "relative", overflow: "hidden",
        background: "var(--grad-hero)",
        color: "white", padding: "80px 24px 72px",
        textAlign: "center",
      }}>
        <Orb style={{ width: 600, height: 600, top: -200, left: "50%", transform: "translateX(-50%)", background: "oklch(0.72 0.20 150 / 0.22)" }} />
        <Orb style={{ width: 300, height: 300, bottom: -80, right: "5%", background: "oklch(0.58 0.22 200 / 0.18)" }} />
        <Orb style={{ width: 200, height: 200, top: 40, left: "8%", background: "oklch(0.72 0.18 120 / 0.15)" }} />

        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          {/* Chip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "color-mix(in oklab, white 10%, transparent)",
            border: "1px solid color-mix(in oklab, white 20%, transparent)",
            borderRadius: 100, padding: "7px 16px", fontSize: 13, fontWeight: 600,
            color: "oklch(0.85 0.18 150)", marginBottom: 28,
            backdropFilter: "blur(12px)",
          }}>
            <Sparkles size={14} /> Chef Leonardo Ferrari
          </div>

          <h1 style={{
            fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 800,
            fontFamily: "var(--font-brand)",
            lineHeight: 1.0, margin: "0 0 20px",
            letterSpacing: "-0.03em",
          }}>
            Seu plano{" "}
            <span style={{ background: "linear-gradient(135deg, oklch(0.85 0.20 150), oklch(0.72 0.22 145))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              FIT PRO
            </span>
            <br />começa agora.
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.6, opacity: 0.78, maxWidth: 460, margin: "0 auto 36px" }}>
            Calculadora de macros inteligente, 80+ receitas premium e tracking de proteína em tempo real.
          </p>

          {/* Stats row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 40 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-brand)", color: "oklch(0.85 0.20 150)" }}>{value}</div>
                <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToForm}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--grad-brand)", color: "white",
              border: "none", borderRadius: 14, padding: "16px 32px",
              fontSize: 16, fontWeight: 700, cursor: "pointer",
              boxShadow: "var(--sh-glow)",
              fontFamily: "var(--font-sans)",
            }}
          >
            Começar grátis <ArrowRight size={18} />
          </button>
        </div>
      </header>

      {/* ── Features Grid ── */}
      <section style={{ padding: "60px 24px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, fontFamily: "var(--font-brand)", letterSpacing: "-0.02em" }}>
            Tudo que você precisa
          </h2>
          <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 8 }}>Num único app, no seu celular.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {FEATURES.map(({ Icon, color, bg, title, desc }) => (
            <div key={title} style={{
              background: "var(--surface)", borderRadius: 18,
              border: "1px solid var(--border)", padding: "22px 20px",
              boxShadow: "var(--sh-sm)", display: "flex", gap: 16, alignItems: "flex-start",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: bg,
                color, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Auth Form ── */}
      <section ref={formRef} style={{ padding: "0 24px 80px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <div style={{
          background: "var(--surface)", borderRadius: 24,
          border: "1px solid var(--border)",
          boxShadow: "var(--sh-md)",
          overflow: "hidden",
        }}>
          {/* Form header */}
          <div style={{
            background: "var(--grad-hero)", padding: "28px 28px 24px",
            color: "white", position: "relative", overflow: "hidden",
          }}>
            <Orb style={{ width: 200, height: 200, top: -60, right: -40, background: "oklch(0.72 0.20 150 / 0.25)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.65, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                Acesso gratuito
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-brand)" }}>
                {mode === "signup" ? "Criar sua conta" : "Bem-vindo de volta 👋"}
              </div>
            </div>
          </div>

          <div style={{ padding: "24px 28px 28px" }}>
            {/* Toggle */}
            <div style={{
              display: "flex", gap: 4, background: "var(--bg)",
              padding: 4, borderRadius: 12, marginBottom: 22,
            }}>
              {(["signup", "login"] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setErr(null); setSuccess(false); }} style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: mode === m ? "var(--surface)" : "transparent",
                  color: mode === m ? "var(--ink)" : "var(--muted)",
                  fontWeight: 700, fontSize: 14,
                  boxShadow: mode === m ? "var(--sh-xs)" : "none",
                  transition: "all 0.18s ease",
                  fontFamily: "var(--font-sans)",
                }}>{m === "signup" ? "Criar conta" : "Entrar"}</button>
              ))}
            </div>

            {success ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                padding: "32px 16px", textAlign: "center",
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "var(--gp)", color: "var(--gd)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Conta criada!</div>
                  <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
                    Verifique seu email <strong>{email}</strong> para ativar sua conta.
                  </div>
                </div>
                <button
                  onClick={() => { setMode("login"); setSuccess(false); }}
                  style={{
                    padding: "12px 24px", borderRadius: 12, border: "none",
                    background: "var(--gp)", color: "var(--gd)",
                    fontWeight: 700, cursor: "pointer", fontSize: 14,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Ir para login
                </button>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
                {mode === "signup" && (
                  <label style={{ display: "grid", gap: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Nome</span>
                    <div style={{ position: "relative" }}>
                      <User size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)" }} />
                      <input
                        className="input" style={{ paddingLeft: 40 }}
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Como podemos te chamar?" required
                      />
                    </div>
                  </label>
                )}

                <label style={{ display: "grid", gap: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Email</span>
                  <div style={{ position: "relative" }}>
                    <Mail size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)" }} />
                    <input
                      className="input" style={{ paddingLeft: 40 }}
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com" required
                    />
                  </div>
                </label>

                <label style={{ display: "grid", gap: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Senha</span>
                  <div style={{ position: "relative" }}>
                    <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)" }} />
                    <input
                      className="input" style={{ paddingLeft: 40 }}
                      type="password" minLength={6}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="mín. 6 caracteres" required
                    />
                  </div>
                </label>

                {err && (
                  <div style={{
                    background: "oklch(0.97 0.04 25)", color: "oklch(0.45 0.18 25)",
                    padding: "10px 14px", borderRadius: 10, fontSize: 13,
                    border: "1px solid oklch(0.88 0.08 25)",
                  }}>
                    {err}
                  </div>
                )}

                <button className="btn-primary" type="submit" disabled={busy} style={{ marginTop: 4 }}>
                  {busy ? "Aguarde…" : mode === "signup" ? "Criar minha conta" : "Entrar no app"} <ArrowRight size={16} />
                </button>

                {mode === "signup" && (
                  <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", lineHeight: 1.5 }}>
                    Você receberá um email para confirmar a conta.
                    <br />100% gratuito, sem cartão de crédito.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "24px", textAlign: "center",
        color: "var(--muted)", fontSize: 13,
        borderTop: "1px solid var(--border)",
        marginTop: "auto",
      }}>
        © 2026 FIT PRO — Chef Leonardo Ferrari
      </footer>
    </div>
  );
}

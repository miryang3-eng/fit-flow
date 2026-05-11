import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Dumbbell, Sparkles, ChefHat, Target, ArrowRight,
  Mail, Lock, User, CheckCircle2, Flame, Trophy, Zap,
  ShieldCheck, Star, LogIn,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "FIT PRO — Plano nutricional inteligente + 80 receitas premium" },
      { name: "description", content: "Calculadora de macros, 80+ receitas fit e tracking de proteína em tempo real. Por apenas R$47." },
    ],
  }),
});

const CHECKOUT_BASE = "https://ggcheckout.app/checkout/v5/qmZO8hJJiOuhcULA4jYY";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "fbclid", "gclid", "sck"];

function buildCheckoutUrl() {
  const params = new URLSearchParams(window.location.search);
  const utms = new URLSearchParams();
  UTM_PARAMS.forEach(k => { const v = params.get(k); if (v) utms.set(k, v); });
  const qs = utms.toString();
  return qs ? `${CHECKOUT_BASE}?${qs}` : CHECKOUT_BASE;
}

const FEATURES = [
  { Icon: Target,   color: "var(--g)",   bg: "var(--gp)",   title: "Metas calculadas",  desc: "BMR, TDEE e macros sob medida para o seu corpo e objetivo." },
  { Icon: ChefHat,  color: "#D97706",    bg: "#FEF9EC",     title: "80+ receitas fit",  desc: "Café, almoço, jantar, lanche, pré e pós-treino." },
  { Icon: Dumbbell, color: "#2563EB",    bg: "#EFF6FF",     title: "Pré e pós-treino",  desc: "Refeições otimizadas para performance e recovery." },
  { Icon: Flame,    color: "#DC2626",    bg: "#FEF2F2",     title: "Track de proteína", desc: "Registre o que comeu e veja o progresso do dia." },
  { Icon: Trophy,   color: "#7C3AED",    bg: "#F5F3FF",     title: "Favoritos",         desc: "Salve suas receitas preferidas para acessar rápido." },
  { Icon: Zap,      color: "#EA580C",    bg: "#FFF7ED",     title: "Funciona offline",  desc: "PWA — instale no celular como um app de verdade." },
];

const TESTIMONIALS = [
  { name: "Ana Paula S.", text: "Perdi 6kg em 2 meses seguindo as receitas do Chef Leonardo. Impossível enjoar!", stars: 5 },
  { name: "Rodrigo M.",   text: "As receitas de pós-treino são incríveis. Minha performance no treino melhorou muito.", stars: 5 },
  { name: "Camila R.",    text: "Finalmente um app de receitas fit que realmente funciona. Recomendo demais!", stars: 5 },
];

function Orb({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", ...style }} />;
}

function Stars({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
      ))}
    </div>
  );
}

export default function Landing() {
  const { session, loading } = useSession();
  const nav = useNavigate();
  useEffect(() => { if (!loading && session) nav({ to: "/app" }); }, [session, loading, nav]);

  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const offerRef = useRef<HTMLDivElement>(null);

  function goCheckout() {
    window.location.href = buildCheckoutUrl();
  }

  function scrollToOffer() {
    offerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) {
      setErr(e.message ?? "Erro ao entrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", fontFamily: "var(--font-sans)", background: "var(--bg)" }}>

      {/* ── Topbar ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "oklch(0.10 0.02 250 / 0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid oklch(1 0 0 / 0.06)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-0.02em" }}>
          FIT <span style={{ color: "var(--g)" }}>PRO</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => setShowLogin(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "1px solid oklch(1 0 0 / 0.18)",
              color: "oklch(0.85 0 0)", borderRadius: 10, padding: "8px 14px",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            <LogIn size={14} /> Já tenho acesso
          </button>
          <button
            onClick={scrollToOffer}
            style={{
              background: "var(--grad-brand)", color: "white",
              border: "none", borderRadius: 10, padding: "8px 18px",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            Quero o FIT PRO
          </button>
        </div>
      </nav>

      {/* ── Login drawer (hidden by default) ── */}
      {showLogin && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "oklch(0.08 0.02 250 / 0.65)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }} onClick={() => setShowLogin(false)}>
          <div style={{
            background: "var(--surface)", borderRadius: 20, padding: 28,
            width: "100%", maxWidth: 400,
            boxShadow: "0 24px 80px oklch(0.08 0.02 250 / 0.35)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, fontFamily: "var(--font-brand)" }}>Entrar no FIT PRO</div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 22 }}>Acesse com seu email e senha.</div>
            <form onSubmit={login} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Email</span>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)" }} />
                  <input className="input" style={{ paddingLeft: 38 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
                </div>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Senha</span>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)" }} />
                  <input className="input" style={{ paddingLeft: 38 }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="sua senha" required />
                </div>
              </label>
              {err && <div style={{ background: "oklch(0.97 0.04 25)", color: "oklch(0.45 0.18 25)", padding: "10px 14px", borderRadius: 10, fontSize: 13, border: "1px solid oklch(0.88 0.08 25)" }}>{err}</div>}
              <button className="btn-primary" type="submit" disabled={busy} style={{ marginTop: 4 }}>
                {busy ? "Entrando…" : "Entrar"} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <header style={{
        position: "relative", overflow: "hidden",
        background: "var(--grad-hero)",
        color: "white", padding: "80px 24px 80px",
        textAlign: "center",
      }}>
        <Orb style={{ width: 600, height: 600, top: -200, left: "50%", transform: "translateX(-50%)", background: "oklch(0.72 0.20 150 / 0.22)" }} />
        <Orb style={{ width: 300, height: 300, bottom: -80, right: "5%", background: "oklch(0.58 0.22 200 / 0.18)" }} />
        <Orb style={{ width: 200, height: 200, top: 40, left: "8%", background: "oklch(0.72 0.18 120 / 0.15)" }} />

        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
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
            fontSize: "clamp(36px, 6vw, 62px)", fontWeight: 800,
            fontFamily: "var(--font-brand)",
            lineHeight: 1.05, margin: "0 0 20px",
            letterSpacing: "-0.03em",
          }}>
            Emagreça comendo{" "}
            <span style={{ background: "linear-gradient(135deg, oklch(0.85 0.20 150), oklch(0.72 0.22 145))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              bem de verdade.
            </span>
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.65, opacity: 0.80, maxWidth: 500, margin: "0 auto 36px" }}>
            80+ receitas fit criadas pelo Chef Leonardo Ferrari, calculadora de macros personalizada e tracking de proteína no seu bolso.
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <button
              onClick={scrollToOffer}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "var(--grad-brand)", color: "white",
                border: "none", borderRadius: 16, padding: "18px 40px",
                fontSize: 17, fontWeight: 700, cursor: "pointer",
                boxShadow: "var(--sh-glow)", fontFamily: "var(--font-sans)",
              }}
            >
              Quero meu plano por R$47 <ArrowRight size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.65, fontSize: 13 }}>
              <ShieldCheck size={14} /> Pagamento 100% seguro · Acesso imediato
            </div>
          </div>
        </div>
      </header>

      {/* ── Social proof bar ── */}
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "18px 24px",
        display: "flex", justifyContent: "center", gap: "clamp(20px, 5vw, 60px)",
        flexWrap: "wrap",
      }}>
        {[
          { value: "80+", label: "receitas exclusivas" },
          { value: "R$47", label: "pagamento único" },
          { value: "100%", label: "personalizado" },
          { value: "∞", label: "acesso vitalício" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-brand)", color: "var(--gd)" }}>{value}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section style={{ padding: "64px 24px 48px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, fontFamily: "var(--font-brand)", letterSpacing: "-0.02em" }}>
            Tudo incluso por R$47
          </h2>
          <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 8 }}>Um único pagamento, acesso pra sempre.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {FEATURES.map(({ Icon, color, bg, title, desc }) => (
            <div key={title} style={{
              background: "var(--surface)", borderRadius: 18,
              border: "1px solid var(--border)", padding: "22px 20px",
              boxShadow: "var(--sh-sm)", display: "flex", gap: 16, alignItems: "flex-start",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
                  <CheckCircle2 size={14} color="var(--gd)" />
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "0 24px 64px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, fontFamily: "var(--font-brand)", letterSpacing: "-0.02em" }}>
            Quem já usa, aprova
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
          {TESTIMONIALS.map(({ name, text, stars }) => (
            <div key={name} style={{
              background: "var(--surface)", borderRadius: 18,
              border: "1px solid var(--border)", padding: "20px",
              boxShadow: "var(--sh-sm)",
            }}>
              <Stars n={stars} />
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)", margin: "12px 0 14px" }}>"{text}"</p>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>{name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Offer Card ── */}
      <section ref={offerRef} style={{ padding: "0 24px 80px", maxWidth: 520, margin: "0 auto", width: "100%" }}>
        <div style={{
          borderRadius: 24, overflow: "hidden",
          boxShadow: "0 20px 60px oklch(0.58 0.19 150 / 0.18), var(--sh-md)",
          border: "2px solid var(--gs)",
        }}>
          {/* Card header */}
          <div style={{
            background: "var(--grad-hero)", padding: "28px 28px 24px",
            color: "white", position: "relative", overflow: "hidden", textAlign: "center",
          }}>
            <Orb style={{ width: 220, height: 220, top: -80, right: -40, background: "oklch(0.72 0.20 150 / 0.28)" }} />
            <div style={{ position: "relative" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "var(--grad-gold)", borderRadius: 100, padding: "5px 14px",
                fontSize: 11, fontWeight: 700, color: "white", marginBottom: 14,
                letterSpacing: 0.5,
              }}>
                <Star size={11} fill="white" /> OFERTA ESPECIAL
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "var(--font-brand)", letterSpacing: "-0.02em" }}>
                FIT PRO Completo
              </div>
              <div style={{ fontSize: 14, opacity: 0.75, marginTop: 4 }}>
                Acesso vitalício a tudo
              </div>
            </div>
          </div>

          {/* Price */}
          <div style={{
            background: "var(--surface)", padding: "28px 28px 0",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 13, color: "var(--muted)", textDecoration: "line-through", fontWeight: 500 }}>
              De R$197
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, margin: "4px 0 4px" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--muted)", alignSelf: "flex-start", paddingTop: 8 }}>R$</span>
              <span style={{ fontSize: 64, fontWeight: 800, fontFamily: "var(--font-brand)", color: "var(--ink)", lineHeight: 1 }}>47</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>pagamento único · acesso imediato</div>

            {/* Checklist */}
            <div style={{ display: "grid", gap: 10, textAlign: "left", marginBottom: 24 }}>
              {[
                "80+ receitas exclusivas do Chef Leonardo Ferrari",
                "Calculadora de macros BMR/TDEE personalizada",
                "Tracking diário de proteína e calorias",
                "Receitas pré e pós-treino otimizadas",
                "Lista de favoritos com acesso rápido",
                "PWA — funciona offline, instale no celular",
                "Atualizações gratuitas para sempre",
              ].map(item => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
                  <CheckCircle2 size={17} color="var(--gd)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: "var(--ink-2)", lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={goCheckout}
              className="btn-primary"
              style={{ width: "100%", fontSize: 17, padding: "18px", justifyContent: "center" }}
            >
              Quero meu FIT PRO agora <ArrowRight size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "16px 0 24px", fontSize: 12, color: "var(--muted)" }}>
              <ShieldCheck size={14} color="var(--gd)" />
              Pagamento seguro via GGCheckout · Pix, cartão ou boleto
            </div>
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
        <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
        <button
          onClick={() => setShowLogin(v => !v)}
          style={{ background: "none", border: "none", color: "var(--gd)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }}
        >
          Já tenho acesso
        </button>
      </footer>
    </div>
  );
}

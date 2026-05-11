import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Home, Utensils, Calculator, User as UserIcon,
  Flame, Drumstick, Wheat, Droplet, Heart, Clock,
  LogOut, Target, Activity, Search, X, Check, ArrowRight,
  Plus, Minus, Zap, Trophy, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { calcTargets, GOAL_LABEL, ACT_LABEL, type Goal, type Activity as ActivityT, type Sex } from "@/lib/macros";
import { RECIPES, CATEGORY_CONFIG, CATEGORY_LABEL, type Recipe } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/app")({ component: AppShell });

/* ── Types ── */
type Profile = {
  id: string; name: string | null; sex: Sex | null; age: number | null;
  height_cm: number | null; weight_kg: number | null;
  goal: Goal | null; activity: ActivityT | null;
  calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null;
  favorites: string[]; onboarded: boolean;
};
type LogEntry = { id: string; name: string; emoji: string; protein: number; kcal: number; ts: number };

/* ── Daily log helpers (localStorage) ── */
const todayKey = () => `fp_log_${new Date().toISOString().split("T")[0]}`;
const getLog = (): LogEntry[] => { try { return JSON.parse(localStorage.getItem(todayKey()) ?? "[]"); } catch { return []; } };
const addLog  = (r: Recipe) => { const l = getLog(); l.push({ id: r.id, name: r.name, emoji: r.emoji, protein: r.protein, kcal: r.kcal, ts: Date.now() }); localStorage.setItem(todayKey(), JSON.stringify(l)); };
const removeLog = (ts: number) => { const l = getLog().filter(e => e.ts !== ts); localStorage.setItem(todayKey(), JSON.stringify(l)); };
const isLoggedToday = (id: string) => getLog().some(e => e.id === id);

/* ── Toast ── */
let toastTimer: ReturnType<typeof setTimeout>;
function showToast(msg: string) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, 2400);
}

/* ── App Shell ── */
function AppShell() {
  const { user, loading } = useSession();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<"home" | "recipes" | "calc" | "profile">("home");
  const [log, setLog] = useState<LogEntry[]>(getLog);

  const refreshLog = useCallback(() => setLog(getLog()), []);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/" }); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user, loading, nav]);

  if (loading || !user || !profile) return <div className="center-loader"><div className="loader" /></div>;
  if (!profile.onboarded) return <Onboarding profile={profile} onDone={setProfile} />;

  const totalProtein = log.reduce((s, e) => s + e.protein, 0);
  const totalKcal    = log.reduce((s, e) => s + e.kcal, 0);
  const proteinGoal  = profile.protein_g ?? 160;
  const kcalGoal     = profile.calories ?? 2000;

  function handleLogRecipe(r: Recipe) {
    addLog(r); refreshLog(); showToast(`+${r.protein}g proteína registrado! 💪`);
  }
  function handleRemoveLog(ts: number) { removeLog(ts); refreshLog(); }

  return (
    <div className="app-shell">
      <div className="scroll-area">
        {tab === "home"    && <HomeTab profile={profile} log={log} totalProtein={totalProtein} totalKcal={totalKcal} proteinGoal={proteinGoal} kcalGoal={kcalGoal} onRemoveLog={handleRemoveLog} onNavRecipes={() => setTab("recipes")} />}
        {tab === "recipes" && <RecipesTab profile={profile} setProfile={setProfile} onLog={handleLogRecipe} />}
        {tab === "calc"    && <CalcTab profile={profile} setProfile={setProfile} />}
        {tab === "profile" && <ProfileTab profile={profile} setProfile={setProfile} log={log} />}
      </div>
      <nav className="tabbar">
        {([
          { k: "home",    Icon: Home,       label: "Início"   },
          { k: "recipes", Icon: Utensils,   label: "Receitas" },
          { k: "calc",    Icon: Calculator, label: "Calcular" },
          { k: "profile", Icon: UserIcon,   label: "Perfil"   },
        ] as const).map(({ k, Icon, label }) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
            <span className="ico-wrap"><Icon size={20} /></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ── Onboarding ── */
function Onboarding({ profile, onDone }: { profile: Profile; onDone: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName]         = useState(profile.name ?? "");
  const [sex, setSex]           = useState<Sex>("male");
  const [age, setAge]           = useState(28);
  const [height, setHeight]     = useState(175);
  const [weight, setWeight]     = useState(75);
  const [goal, setGoal]         = useState<Goal>("maintain");
  const [activity, setActivity] = useState<ActivityT>("moderate");
  const [saving, setSaving]     = useState(false);

  const targets = useMemo(() => calcTargets({ sex, age, height_cm: height, weight_kg: weight, goal, activity }), [sex, age, height, weight, goal, activity]);
  const TOTAL = 6;

  async function finish() {
    setSaving(true);
    const { data, error } = await supabase.from("profiles").update({
      name, sex, age, height_cm: height, weight_kg: weight, goal, activity, ...targets, onboarded: true,
    }).eq("id", profile.id).select().single();
    if (!error && data) onDone(data as Profile);
    setSaving(false);
  }

  const STEPS = [
    {
      icon: "👋", title: "Boas-vindas!", sub: "Vamos montar seu plano FIT PRO em 2 minutos.",
      content: (
        <div>
          <Field label="Como podemos te chamar?">
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" autoFocus />
          </Field>
        </div>
      ),
    },
    {
      icon: "👤", title: "Sobre você", sub: "Sexo e idade para o cálculo correto.",
      content: (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {(["male", "female"] as Sex[]).map(s => (
              <button key={s} type="button" className={`ob-opt ${sex === s ? "sel" : ""}`} style={{ flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, gap: 6 }} onClick={() => setSex(s)}>
                <span style={{ fontSize: 28 }}>{s === "male" ? "♂️" : "♀️"}</span>
                <span style={{ fontWeight: 800 }}>{s === "male" ? "Masculino" : "Feminino"}</span>
              </button>
            ))}
          </div>
          <Field label="Idade">
            <input className="input" type="number" value={age} onChange={e => setAge(+e.target.value)} min={10} max={90} />
          </Field>
        </div>
      ),
    },
    {
      icon: "📏", title: "Suas medidas", sub: "Altura e peso atuais para calcular suas calorias.",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Altura (cm)"><input className="input" type="number" value={height} onChange={e => setHeight(+e.target.value)} /></Field>
            <Field label="Peso (kg)"><input className="input" type="number" value={weight} onChange={e => setWeight(+e.target.value)} /></Field>
          </div>
        </div>
      ),
    },
    {
      icon: "🎯", title: "Objetivo", sub: "O que você quer conquistar agora?",
      content: (
        <div style={{ display: "grid", gap: 8 }}>
          {([
            { v: "bulk"     as Goal, icon: "📈", title: "Ganhar massa",  sub: "Foco em hipertrofia" },
            { v: "cut"      as Goal, icon: "🔥", title: "Perder gordura", sub: "Cutting com definição" },
            { v: "maintain" as Goal, icon: "⚖️", title: "Manter forma",  sub: "Equilíbrio e saúde" },
          ]).map(o => (
            <button key={o.v} type="button" className={`ob-opt ${goal === o.v ? "sel" : ""}`} onClick={() => setGoal(o.v)}>
              <span style={{ fontSize: 24 }}>{o.icon}</span>
              <div><div style={{ fontWeight: 800 }}>{o.title}</div><div style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>{o.sub}</div></div>
              {goal === o.v && <Check size={18} style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </div>
      ),
    },
    {
      icon: "🏋️", title: "Nível de atividade", sub: "Quantos dias você treina por semana?",
      content: (
        <div style={{ display: "grid", gap: 8 }}>
          {([
            { v: "sedentary" as ActivityT, icon: "🛋️", title: "Sedentário",    sub: "Pouco exercício" },
            { v: "light"     as ActivityT, icon: "🚶", title: "Leve",          sub: "1–2x por semana" },
            { v: "moderate"  as ActivityT, icon: "🏃", title: "Moderado",      sub: "3–5x por semana" },
            { v: "active"    as ActivityT, icon: "💪", title: "Ativo",         sub: "6–7x por semana" },
            { v: "veryActive"as ActivityT, icon: "🏆", title: "Muito ativo",   sub: "2x ao dia / atleta" },
          ]).map(o => (
            <button key={o.v} type="button" className={`ob-opt ${activity === o.v ? "sel" : ""}`} onClick={() => setActivity(o.v)}>
              <span style={{ fontSize: 22 }}>{o.icon}</span>
              <div><div style={{ fontWeight: 800 }}>{o.title}</div><div style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>{o.sub}</div></div>
              {activity === o.v && <Check size={18} style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </div>
      ),
    },
    {
      icon: "✅", title: "Seus alvos diários", sub: "Calculamos tudo com base no seu perfil.",
      content: (
        <div>
          <div style={{ background: "var(--grad-brand)", borderRadius: 20, padding: 28, textAlign: "center", color: "#052e1a", boxShadow: "var(--sh-glow)" }}>
            <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, fontFamily: "var(--font-brand)" }}>{targets.calories}</div>
            <div style={{ fontSize: 15, fontWeight: 600, opacity: .8 }}>kcal por dia</div>
            <div style={{ background: "white", borderRadius: 14, padding: 16, marginTop: 18, display: "grid", gap: 10 }}>
              {[
                { icon: "💪", label: "Proteína", val: `${targets.protein_g}g` },
                { icon: "🌾", label: "Carboidratos", val: `${targets.carbs_g}g` },
                { icon: "💧", label: "Gorduras", val: `${targets.fat_g}g` },
              ].map(x => (
                <div key={x.label} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}><span>{x.icon}</span>{x.label}</span>
                  <strong>{x.val}</strong>
                </div>
              ))}
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 14 }}>Você poderá ajustar a qualquer momento na aba Calcular.</p>
        </div>
      ),
    },
  ];

  const s = STEPS[step];
  return (
    <div className="app-shell" style={{ background: "white" }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 6, padding: "16px 24px 0" }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: i <= step ? "100%" : "0%", background: "var(--grad-brand)", transition: "width .35s" }} />
          </div>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: "32px 24px", overflowY: "auto" }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>{s.icon}</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15, marginBottom: 8, fontFamily: "var(--font-brand)" }}>{s.title}</h2>
        <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>{s.sub}</p>
        {s.content}
      </div>
      {/* Footer */}
      <div style={{ padding: "14px 24px", paddingBottom: "max(14px, env(safe-area-inset-bottom))", display: "flex", gap: 10 }}>
        {step > 0 && <button className="btn-ghost" style={{ width: "auto", minWidth: 90 }} onClick={() => setStep(s => s - 1)}>← Voltar</button>}
        {step < TOTAL - 1 && (
          <button className="btn-primary" onClick={() => setStep(s => s + 1)} disabled={step === 0 && !name.trim()}>
            Continuar <ArrowRight size={16} />
          </button>
        )}
        {step === TOTAL - 1 && (
          <button className="btn-primary" onClick={finish} disabled={saving}>
            {saving ? <span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Check size={16} /> Começar agora</>}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, flex: 1 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</span>
      {children}
    </label>
  );
}

/* ── Home Tab ── */
type HomeProps = {
  profile: Profile; log: LogEntry[];
  totalProtein: number; totalKcal: number;
  proteinGoal: number; kcalGoal: number;
  onRemoveLog: (ts: number) => void;
  onNavRecipes: () => void;
};
function HomeTab({ profile, log, totalProtein, totalKcal, proteinGoal, kcalGoal, onRemoveLog, onNavRecipes }: HomeProps) {
  const hrs = new Date().getHours();
  const greeting = hrs < 12 ? "Bom dia" : hrs < 18 ? "Boa tarde" : "Boa noite";
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const recommended = useMemo(() => RECIPES.filter(r => profile.goal && r.goal.includes(profile.goal)).sort(() => .5 - Math.random()).slice(0, 8), [profile.goal]);
  const pct = Math.min(totalProtein / proteinGoal, 1);
  const r = 52; const circ = 2 * Math.PI * r;

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-logo">FIT <em>PRO</em></div>
        <div className="topbar-av">{(profile.name ?? "FP").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}</div>
      </div>

      {/* Greeting */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-brand)" }}>{greeting}, {profile.name?.split(" ")[0] ?? "FIT"}! 👋</div>
        <div style={{ fontSize: 13, color: "var(--muted)", textTransform: "capitalize", marginTop: 2 }}>{today}</div>
      </div>

      {/* Protein Ring Card */}
      <div className="card" style={{ margin: "16px 20px", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg width={120} height={120} viewBox="0 0 120 120">
              <circle cx={60} cy={60} r={r} fill="none" stroke="var(--border)" strokeWidth={9} />
              <circle cx={60} cy={60} r={r} fill="none"
                stroke="url(#rg)" strokeWidth={9}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                transform="rotate(-90 60 60)"
                className="ring-arc"
              />
              <defs>
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.78 0.19 150)" />
                  <stop offset="100%" stopColor="oklch(0.58 0.19 150)" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-brand)", lineHeight: 1 }}>{totalProtein}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>/ {proteinGoal}g</div>
            </div>
          </div>
          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Proteína de hoje</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
              {totalProtein >= proteinGoal
                ? "🎉 Meta atingida! Incrível!"
                : `Faltam ${proteinGoal - totalProtein}g para sua meta.`}
            </div>
            {/* Mini macro row */}
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ background: "var(--gp)", color: "var(--gd)", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                🔥 {totalKcal}kcal
              </span>
              <span style={{ background: "var(--bg)", color: "var(--muted)", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                {Math.round(pct * 100)}%
              </span>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 16, background: "var(--border)", borderRadius: 99, height: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, background: "var(--grad-brand)", borderRadius: 99, transition: "width .8s cubic-bezier(.16,1,.3,1)" }} />
        </div>
        <button className="btn-primary" style={{ marginTop: 14 }} onClick={onNavRecipes}>
          <Plus size={16} /> Adicionar receita
        </button>
      </div>

      {/* Daily Log */}
      {log.length > 0 && (
        <>
          <div className="sec-ttl">Registrado hoje</div>
          <div style={{ padding: "0 20px", display: "grid", gap: 8 }}>
            {log.map(entry => (
              <div key={entry.ts} className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{entry.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{entry.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>💪 {entry.protein}g · 🔥 {entry.kcal}kcal</div>
                </div>
                <button onClick={() => onRemoveLog(entry.ts)} style={{ background: "none", border: "none", color: "var(--muted-2)", cursor: "pointer", padding: 4 }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick Stats */}
      <div className="sec-ttl">Suas metas</div>
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {[
          { icon: "🔥", label: "Calorias", val: profile.calories ?? 0, unit: "kcal", accent: true },
          { icon: "💪", label: "Proteína", val: profile.protein_g ?? 0, unit: "g/dia" },
          { icon: "🌾", label: "Carboidratos", val: profile.carbs_g ?? 0, unit: "g/dia" },
          { icon: "💧", label: "Gorduras", val: profile.fat_g ?? 0, unit: "g/dia" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: s.accent ? "var(--grad-brand)" : "var(--gp)", display: "grid", placeItems: "center", fontSize: 18, boxShadow: s.accent ? "var(--sh-glow)" : "none" }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, fontFamily: "var(--font-brand)" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>{s.label} · {s.unit}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommended */}
      <div className="sec-ttl">Recomendados para você</div>
      <div className="h-scroll">
        {recommended.map(r => <RecipeCard key={r.id} recipe={r} onOpen={() => {}} compact />)}
      </div>

      {/* All categories */}
      <div className="sec-ttl">Categorias</div>
      <div style={{ padding: "0 20px 16px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {(Object.entries(CATEGORY_CONFIG) as [Recipe["category"], typeof CATEGORY_CONFIG[Recipe["category"]]][]).map(([cat, cfg]) => (
          <div key={cat} className="card card-hover" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `var(--cat-${cat}-bg, var(--gp))`, display: "grid", placeItems: "center", fontSize: 20 }}>
              {cfg.emoji}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{cfg.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{RECIPES.filter(r => r.category === cat).length} receitas</div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted-2)", marginLeft: "auto" }} />
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Recipes Tab ── */
function RecipesTab({ profile, setProfile, onLog }: { profile: Profile; setProfile: (p: Profile) => void; onLog: (r: Recipe) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Recipe["category"] | "all">("all");
  const [open, setOpen] = useState<Recipe | null>(null);
  const [loggedIds, setLoggedIds] = useState(() => new Set(getLog().map(e => e.id)));
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => RECIPES.filter(r =>
    (cat === "all" || r.category === cat) &&
    (!q || r.name.toLowerCase().includes(q.toLowerCase()) || r.emoji.includes(q))
  ), [q, cat]);

  async function toggleFav(id: string) {
    const fav = profile.favorites.includes(id) ? profile.favorites.filter(x => x !== id) : [...profile.favorites, id];
    const { data } = await supabase.from("profiles").update({ favorites: fav }).eq("id", profile.id).select().single();
    if (data) setProfile(data as Profile);
  }

  function handleLog(r: Recipe) {
    onLog(r);
    setLoggedIds(prev => new Set([...prev, r.id]));
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-logo">FIT <em>PRO</em></div>
        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>{filtered.length} receitas</span>
      </div>

      {/* Search */}
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)" }} />
          <input ref={searchRef} className="input" style={{ paddingLeft: 42, paddingRight: q ? 40 : 14 }}
            placeholder="Buscar receita…" value={q} onChange={e => setQ(e.target.value)} />
          {q && (
            <button onClick={() => setQ("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted-2)" }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="h-scroll" style={{ marginTop: 12, paddingBottom: 4 }}>
        <button onClick={() => setCat("all")} className="chip" style={{ background: cat === "all" ? "var(--grad-brand)" : "var(--gp)", color: cat === "all" ? "#052e1a" : "var(--gd)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          🍽️ Todas
        </button>
        {(Object.entries(CATEGORY_CONFIG) as [Recipe["category"], typeof CATEGORY_CONFIG[Recipe["category"]]][]).map(([k, cfg]) => (
          <button key={k} onClick={() => setCat(k)} className="chip" style={{ background: cat === k ? "var(--grad-brand)" : "var(--gp)", color: cat === k ? "#052e1a" : "var(--gd)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ padding: "8px 20px 16px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {filtered.map(r => (
          <button key={r.id} onClick={() => setOpen(r)} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div className="card card-hover" style={{ overflow: "hidden" }}>
              <div className={`r-thumb ${CATEGORY_CONFIG[r.category].thumbClass}`} style={{ height: 108, fontSize: 44, position: "relative" }}>
                {r.emoji}
                {loggedIds.has(r.id) && (
                  <div style={{ position: "absolute", top: 8, right: 8, background: "var(--g)", color: "white", borderRadius: 999, width: 20, height: 20, display: "grid", placeItems: "center" }}>
                    <Check size={12} />
                  </div>
                )}
                <button className="fav-btn" style={{ position: "absolute", top: 6, left: 6 }} onClick={(e) => { e.stopPropagation(); toggleFav(r.id); }}>
                  <Heart size={16} fill={profile.favorites.includes(r.id) ? "#ef4444" : "none"} color={profile.favorites.includes(r.id) ? "#ef4444" : "white"} />
                </button>
              </div>
              <div style={{ padding: "10px 12px 12px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.35, marginBottom: 6 }}>{r.name}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ background: "var(--gp)", color: "var(--gd)", padding: "2px 7px", borderRadius: 7, fontSize: 10, fontWeight: 700 }}>💪 {r.protein}g</span>
                  <span style={{ background: "var(--bg)", color: "var(--muted)", padding: "2px 7px", borderRadius: 7, fontSize: 10, fontWeight: 700 }}>⏱ {r.time_min}m</span>
                </div>
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700 }}>Nenhuma receita encontrada</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Tente outro filtro ou busca</div>
          </div>
        )}
      </div>

      {open && (
        <RecipeModal recipe={open} onClose={() => setOpen(null)}
          fav={profile.favorites.includes(open.id)}
          onToggleFav={() => toggleFav(open.id)}
          logged={loggedIds.has(open.id)}
          onLog={() => handleLog(open)}
        />
      )}
    </>
  );
}

/* ── Recipe Card (horizontal scroll) ── */
function RecipeCard({ recipe, onOpen, compact }: { recipe: Recipe; onOpen: () => void; compact?: boolean }) {
  const cfg = CATEGORY_CONFIG[recipe.category];
  return (
    <button onClick={onOpen} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
      <div className="card card-hover" style={{ width: compact ? 180 : 200, overflow: "hidden" }}>
        <div className={`r-thumb ${cfg.thumbClass}`} style={{ height: compact ? 100 : 120, fontSize: compact ? 40 : 48 }}>
          {recipe.emoji}
        </div>
        <div style={{ padding: "10px 12px 12px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 6 }}>{recipe.name}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ background: "var(--gp)", color: "var(--gd)", padding: "2px 7px", borderRadius: 7, fontSize: 10, fontWeight: 700 }}>💪 {recipe.protein}g</span>
            <span style={{ background: "var(--bg)", color: "var(--muted)", padding: "2px 7px", borderRadius: 7, fontSize: 10, fontWeight: 700 }}>⏱ {recipe.time_min}m</span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Recipe Modal ── */
function RecipeModal({ recipe, onClose, fav, onToggleFav, logged, onLog }: {
  recipe: Recipe; onClose: () => void;
  fav: boolean; onToggleFav: () => void;
  logged: boolean; onLog: () => void;
}) {
  const cfg = CATEGORY_CONFIG[recipe.category];
  return (
    <div className="modal-ov" onClick={onClose} style={{ position: "fixed" }}>
      <div className="modal-sheet" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
          <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 99 }} />
        </div>

        {/* Hero header */}
        <div className={`r-thumb ${cfg.thumbClass}`} style={{ height: 180, fontSize: 80, margin: "10px 16px", borderRadius: 20 }}>
          {recipe.emoji}
        </div>

        <div style={{ padding: "0 20px 24px" }}>
          {/* Category + name */}
          <div style={{ marginBottom: 8 }}>
            <span className={`cat-badge ${cfg.badgeClass}`}>{cfg.emoji} {cfg.label}</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 4, fontFamily: "var(--font-brand)" }}>{recipe.name}</h2>
          <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 18 }}>
            <span style={{ display: "flex", gap: 4, alignItems: "center" }}><Clock size={13} />{recipe.time_min} min</span>
            <span>·</span>
            <span>{recipe.servings} porção</span>
          </div>

          {/* Macros grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 22 }}>
            {[
              { icon: "🔥", label: "kcal", val: recipe.kcal, accent: true },
              { icon: "💪", label: "prot", val: `${recipe.protein}g` },
              { icon: "🌾", label: "carb", val: `${recipe.carbs}g` },
              { icon: "💧", label: "gord", val: `${recipe.fat}g` },
            ].map(m => (
              <div key={m.label} style={{ background: m.accent ? "var(--gp)" : "var(--bg)", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{m.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: m.accent ? "var(--gd)" : "var(--ink)", fontFamily: "var(--font-brand)" }}>{m.val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 10 }}>Ingredientes</h3>
          <div style={{ display: "grid", gap: 0, marginBottom: 20 }}>
            {recipe.ingredients.map((ing, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--g)", marginTop: 7, flexShrink: 0 }} />
                {ing}
              </div>
            ))}
          </div>

          {/* Steps */}
          <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 10 }}>Modo de preparo</h3>
          <div style={{ display: "grid", gap: 10, marginBottom: recipe.tip ? 16 : 20 }}>
            {recipe.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, fontSize: 14, lineHeight: 1.6 }}>
                <div style={{ width: 26, height: 26, borderRadius: 999, background: "var(--grad-brand)", color: "#052e1a", display: "grid", placeItems: "center", fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{i + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Tip */}
          {recipe.tip && (
            <div style={{ background: "var(--gp)", color: "var(--gd)", padding: "12px 14px", borderRadius: 14, fontSize: 13, display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <div><strong>Dica do Chef:</strong> {recipe.tip}</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "grid", gap: 10 }}>
            <button className={logged ? "btn-ghost" : "btn-primary"} onClick={() => { if (!logged) onLog(); }} style={{ opacity: logged ? 1 : undefined }}>
              {logged ? <><Check size={16} /> Proteína já registrada</> : <><Zap size={16} /> Registrar proteína ({recipe.protein}g)</>}
            </button>
            <button className="btn-ghost" onClick={onToggleFav}>
              <Heart size={16} fill={fav ? "currentColor" : "none"} />
              {fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Calc Tab ── */
function CalcTab({ profile, setProfile }: { profile: Profile; setProfile: (p: Profile) => void }) {
  const [sex, setSex]           = useState<Sex>(profile.sex ?? "male");
  const [age, setAge]           = useState(profile.age ?? 28);
  const [height, setHeight]     = useState(profile.height_cm ?? 175);
  const [weight, setWeight]     = useState(profile.weight_kg ?? 75);
  const [goal, setGoal]         = useState<Goal>(profile.goal ?? "maintain");
  const [activity, setActivity] = useState<ActivityT>(profile.activity ?? "moderate");
  const [saved, setSaved]       = useState(false);

  const targets = useMemo(() => calcTargets({ sex, age, height_cm: +height, weight_kg: +weight, goal, activity }), [sex, age, height, weight, goal, activity]);

  async function save() {
    const { data } = await supabase.from("profiles").update({
      sex, age: +age, height_cm: +height, weight_kg: +weight, goal, activity, ...targets,
    }).eq("id", profile.id).select().single();
    if (data) { setProfile(data as Profile); setSaved(true); setTimeout(() => setSaved(false), 2500); showToast("Metas atualizadas! ✅"); }
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-logo">FIT <em>PRO</em></div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>Calculadora</div>
      </div>
      <div style={{ padding: 20, display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-brand)" }}>Calcular macros</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Ajuste seus dados e veja os resultados em tempo real.</p>
        </div>

        <div className="card" style={{ padding: 18, display: "grid", gap: 14 }}>
          {/* Sex */}
          <div style={{ display: "flex", gap: 10 }}>
            {(["male", "female"] as Sex[]).map(s => (
              <button key={s} type="button" onClick={() => setSex(s)} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1.5px solid ${sex === s ? "var(--g)" : "var(--border)"}`, background: sex === s ? "var(--gp)" : "var(--bg)", color: sex === s ? "var(--gd)" : "var(--muted)", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
                {s === "male" ? "♂️ Masc." : "♀️ Fem."}
              </button>
            ))}
          </div>
          {/* Inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Idade"><input className="input" type="number" value={age} onChange={e => setAge(+e.target.value)} /></Field>
            <Field label="Peso (kg)"><input className="input" type="number" value={weight} onChange={e => setWeight(+e.target.value)} /></Field>
            <Field label="Altura (cm)"><input className="input" type="number" value={height} onChange={e => setHeight(+e.target.value)} /></Field>
          </div>
          <Field label="Objetivo">
            <select className="input" style={{ cursor: "pointer" }} value={goal} onChange={e => setGoal(e.target.value as Goal)}>
              <option value="bulk">📈 Ganhar massa</option>
              <option value="cut">🔥 Perder gordura</option>
              <option value="maintain">⚖️ Manter forma</option>
            </select>
          </Field>
          <Field label="Nível de atividade">
            <select className="input" style={{ cursor: "pointer" }} value={activity} onChange={e => setActivity(e.target.value as ActivityT)}>
              <option value="sedentary">🛋️ Sedentário</option>
              <option value="light">🚶 Leve (1–2x/sem)</option>
              <option value="moderate">🏃 Moderado (3–5x/sem)</option>
              <option value="active">💪 Ativo (6–7x/sem)</option>
              <option value="veryActive">🏆 Muito ativo (2x/dia)</option>
            </select>
          </Field>
        </div>

        {/* Live results */}
        <div style={{ background: "var(--grad-brand)", borderRadius: 20, padding: 24, color: "#052e1a", boxShadow: "var(--sh-glow)" }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, fontFamily: "var(--font-brand)" }}>{targets.calories}</div>
            <div style={{ fontSize: 14, fontWeight: 700, opacity: .75 }}>calorias por dia</div>
          </div>
          <div style={{ background: "white", borderRadius: 14, padding: "4px 0" }}>
            {[
              { icon: "💪", label: "Proteína",      val: `${targets.protein_g}g`  },
              { icon: "🌾", label: "Carboidratos",  val: `${targets.carbs_g}g`    },
              { icon: "💧", label: "Gorduras",       val: `${targets.fat_g}g`      },
            ].map((m, i, arr) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: 16, marginRight: 10 }}>{m.icon}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{m.label}</span>
                <strong style={{ fontFamily: "var(--font-brand)", fontSize: 15 }}>{m.val}</strong>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={save}>
          {saved ? <><Check size={16} /> Salvo!</> : <><Target size={16} /> Salvar como minhas metas</>}
        </button>
      </div>
    </>
  );
}

/* ── Profile Tab ── */
function ProfileTab({ profile, setProfile, log }: { profile: Profile; setProfile: (p: Profile) => void; log: LogEntry[] }) {
  const nav = useNavigate();
  const favorites = RECIPES.filter(r => profile.favorites.includes(r.id));
  const initials = (profile.name ?? "FP").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const totalProtein = log.reduce((s, e) => s + e.protein, 0);

  async function logout() { await supabase.auth.signOut(); nav({ to: "/" }); }

  return (
    <>
      <div className="topbar">
        <div className="topbar-logo">FIT <em>PRO</em></div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>Perfil</div>
      </div>
      <div style={{ padding: "20px 20px 0" }}>
        {/* Avatar + name */}
        <div className="card" style={{ padding: 22, display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: "var(--grad-brand)", color: "#052e1a", display: "grid", placeItems: "center", fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 22, boxShadow: "var(--sh-glow)", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "var(--font-brand)" }}>{profile.name ?? "—"}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
              {profile.goal ? GOAL_LABEL[profile.goal] : "—"} · {profile.activity ? ACT_LABEL[profile.activity] : "—"}
            </div>
          </div>
          {totalProtein > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--gd)" }}>{totalProtein}g</div>
              <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>hoje</div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { icon: "🔥", val: profile.calories ?? 0, lbl: "kcal/dia" },
            { icon: "💪", val: `${profile.protein_g ?? 0}g`, lbl: "prot/dia" },
            { icon: "❤️", val: favorites.length, lbl: "favoritos" },
          ].map(s => (
            <div key={s.lbl} className="card" style={{ padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 16, fontFamily: "var(--font-brand)" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Data */}
        <div className="card" style={{ padding: 18, marginBottom: 14 }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 12 }}>Dados físicos</h3>
          {[
            { icon: "👤", label: "Sexo",   val: profile.sex === "male" ? "Masculino" : profile.sex === "female" ? "Feminino" : "—" },
            { icon: "🎂", label: "Idade",  val: profile.age ? `${profile.age} anos` : "—" },
            { icon: "📏", label: "Altura", val: profile.height_cm ? `${profile.height_cm}cm` : "—" },
            { icon: "⚖️", label: "Peso",   val: profile.weight_kg ? `${profile.weight_kg}kg` : "—" },
          ].map(({ icon, label, val }, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 16, marginRight: 12 }}>{icon}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
              <strong style={{ fontSize: 14, fontFamily: "var(--font-brand)" }}>{val}</strong>
            </div>
          ))}
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 10 }}>❤️ Favoritos ({favorites.length})</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {favorites.map(r => (
                <div key={r.id} className="card" style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>{r.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>💪 {r.protein}g · 🔥 {r.kcal} kcal</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: 10, paddingBottom: 16 }}>
          <button className="btn-danger" onClick={logout}><LogOut size={16} /> Sair da conta</button>
        </div>
      </div>
    </>
  );
}

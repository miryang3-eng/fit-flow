import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Home, Utensils, Calculator, User as UserIcon,
  Flame, Drumstick, Wheat, Droplet, Heart, Clock, ChefHat,
  LogOut, Settings, Target, Activity, Search, X, Check, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { calcTargets, GOAL_LABEL, ACT_LABEL, type Goal, type Activity as ActivityT, type Sex } from "@/lib/macros";
import { RECIPES, CATEGORY_LABEL, type Recipe } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/app")({ component: AppShell });

type Profile = {
  id: string; name: string | null; sex: Sex | null; age: number | null;
  height_cm: number | null; weight_kg: number | null;
  goal: Goal | null; activity: ActivityT | null;
  calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null;
  favorites: string[]; onboarded: boolean;
};

function AppShell() {
  const { user, loading } = useSession();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<"home" | "recipes" | "calc" | "profile">("home");

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/" }); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user, loading, nav]);

  if (loading || !user) return <CenterLoader />;
  if (!profile) return <CenterLoader />;
  if (!profile.onboarded) return <Onboarding profile={profile} onDone={setProfile} />;

  return (
    <div className="app-shell">
      <div className="scroll-area">
        {tab === "home" && <HomeTab profile={profile} />}
        {tab === "recipes" && <RecipesTab profile={profile} setProfile={setProfile} />}
        {tab === "calc" && <CalcTab profile={profile} setProfile={setProfile} />}
        {tab === "profile" && <ProfileTab profile={profile} setProfile={setProfile} />}
      </div>
      <nav className="tabbar">
        {[
          { k: "home", Icon: Home, label: "Início" },
          { k: "recipes", Icon: Utensils, label: "Receitas" },
          { k: "calc", Icon: Calculator, label: "Calcular" },
          { k: "profile", Icon: UserIcon, label: "Perfil" },
        ].map(({ k, Icon, label }) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k as any)}>
            <span className="ico-wrap"><Icon size={20} /></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function CenterLoader() {
  return <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", color: "var(--muted)" }}>Carregando…</div>;
}

/* ─────────── Onboarding ─────────── */
function Onboarding({ profile, onDone }: { profile: Profile; onDone: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name ?? "");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const [goal, setGoal] = useState<Goal>("maintain");
  const [activity, setActivity] = useState<ActivityT>("moderate");
  const targets = useMemo(() => calcTargets({ sex, age, height_cm: height, weight_kg: weight, goal, activity }), [sex, age, height, weight, goal, activity]);
  const total = 6;
  const next = () => setStep(s => Math.min(s + 1, total - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  async function finish() {
    const { data, error } = await supabase.from("profiles").update({
      name, sex, age, height_cm: height, weight_kg: weight, goal, activity,
      ...targets, onboarded: true,
    }).eq("id", profile.id).select().single();
    if (!error && data) onDone(data as Profile);
  }

  return (
    <div className="app-shell" style={{ background: "white" }}>
      <div style={{ display: "flex", gap: 6, padding: "16px 24px 0" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: i <= step ? "100%" : "0%", background: "var(--gradient-brand)", transition: "width .3s" }} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: "32px 24px", overflowY: "auto" }}>
        {step === 0 && <Step icon={<Heart size={40} />} title="Boas-vindas!" subtitle="Vamos conhecer você para criar seu plano FIT PRO sob medida.">
          <Field label="Seu nome"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Como podemos te chamar?" /></Field>
        </Step>}
        {step === 1 && <Step icon={<UserIcon size={40} />} title="Conte sobre você" subtitle="Esses dados ajudam a calcular suas metas.">
          <Options value={sex} onChange={(v) => setSex(v as Sex)} options={[
            { v: "male", label: "Masculino" }, { v: "female", label: "Feminino" },
          ]} />
          <Field label="Idade"><input className="input" type="number" value={age} onChange={e => setAge(+e.target.value)} /></Field>
        </Step>}
        {step === 2 && <Step icon={<Activity size={40} />} title="Suas medidas" subtitle="Altura e peso atuais.">
          <Field label="Altura (cm)"><input className="input" type="number" value={height} onChange={e => setHeight(+e.target.value)} /></Field>
          <Field label="Peso (kg)"><input className="input" type="number" value={weight} onChange={e => setWeight(+e.target.value)} /></Field>
        </Step>}
        {step === 3 && <Step icon={<Target size={40} />} title="Qual seu objetivo?" subtitle="Escolha o que faz sentido agora.">
          <Options value={goal} onChange={(v) => setGoal(v as Goal)} options={[
            { v: "bulk", label: "Ganhar massa", sub: "Bulking — mais músculo" },
            { v: "cut", label: "Perder gordura", sub: "Cutting — definição" },
            { v: "maintain", label: "Manter forma", sub: "Equilíbrio e saúde" },
          ]} />
        </Step>}
        {step === 4 && <Step icon={<Activity size={40} />} title="Nível de atividade" subtitle="Quanto você se movimenta na semana.">
          <Options value={activity} onChange={(v) => setActivity(v as ActivityT)} options={[
            { v: "sedentary", label: "Sedentário", sub: "Pouco ou nenhum exercício" },
            { v: "light", label: "Leve", sub: "1–2 dias/semana" },
            { v: "moderate", label: "Moderado", sub: "3–5 dias/semana" },
            { v: "active", label: "Ativo", sub: "6–7 dias/semana" },
            { v: "veryActive", label: "Muito ativo", sub: "2x ao dia / atleta" },
          ]} />
        </Step>}
        {step === 5 && <Step icon={<Check size={40} />} title="Tudo pronto!" subtitle="Estes são seus alvos diários.">
          <ResultsCard targets={targets} />
        </Step>}
      </div>
      <div style={{ padding: "14px 24px calc(14px + env(safe-area-inset-bottom))", display: "flex", gap: 10 }}>
        {step > 0 && <button className="btn-ghost" onClick={back}>Voltar</button>}
        {step < total - 1 && <button className="btn-primary" style={{ flex: 1 }} onClick={next} disabled={step === 0 && !name.trim()}>Continuar <ArrowRight size={16} /></button>}
        {step === total - 1 && <button className="btn-primary" style={{ flex: 1 }} onClick={finish}>Começar <Check size={16} /></button>}
      </div>
    </div>
  );
}

function Step({ icon, title, subtitle, children }: any) {
  return (
    <div>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--gp)", color: "var(--gd)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{icon}</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "var(--muted)", marginBottom: 22, fontSize: 15 }}>{subtitle}</p>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </div>
  );
}
function Field({ label, children }: any) {
  return <label style={{ display: "grid", gap: 6 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
    {children}
  </label>;
}
function Options({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; label: string; sub?: string }[] }) {
  return <div style={{ display: "grid", gap: 8 }}>
    {options.map(o => {
      const sel = value === o.v;
      return <button key={o.v} type="button" onClick={() => onChange(o.v)} style={{
        textAlign: "left", padding: "14px 16px", borderRadius: 12,
        background: sel ? "var(--gp)" : "var(--bg)",
        color: sel ? "var(--gd)" : "var(--ink)",
        border: `1.5px solid ${sel ? "var(--g)" : "var(--border)"}`,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{o.label}</div>
          {o.sub && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{o.sub}</div>}
        </div>
        {sel && <Check size={18} />}
      </button>;
    })}
  </div>;
}
function ResultsCard({ targets }: { targets: ReturnType<typeof calcTargets> }) {
  return <div style={{ background: "var(--gradient-brand)", color: "#052e1a", borderRadius: 22, padding: 28, textAlign: "center", boxShadow: "var(--shadow-glow)" }}>
    <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{targets.calories}</div>
    <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.8 }}>kcal por dia</div>
    <div style={{ background: "white", color: "var(--ink)", borderRadius: 14, padding: 14, marginTop: 18, display: "grid", gap: 8, fontSize: 13 }}>
      <Row icon={<Drumstick size={14} />} label="Proteína" value={`${targets.protein_g}g`} />
      <Row icon={<Wheat size={14} />} label="Carboidrato" value={`${targets.carbs_g}g`} />
      <Row icon={<Droplet size={14} />} label="Gordura" value={`${targets.fat_g}g`} />
    </div>
  </div>;
}
function Row({ icon, label, value }: any) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
    <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>{icon}{label}</span>
    <strong>{value}</strong>
  </div>;
}

/* ─────────── Home Tab ─────────── */
function HomeTab({ profile }: { profile: Profile }) {
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const recommended = useMemo(() => RECIPES.filter(r => profile.goal && r.goal.includes(profile.goal)).slice(0, 6), [profile.goal]);
  return (
    <>
      <Topbar profile={profile} />
      <header style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Olá, {profile.name?.split(" ")[0] ?? "FIT"}!</div>
        <div style={{ fontSize: 13, color: "var(--muted)", textTransform: "capitalize" }}>{today}</div>
      </header>

      <div style={{ margin: "16px 20px" }} className="card">
        <div style={{ padding: 22, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={18} style={{ color: "var(--gd)" }} />
            <span style={{ fontWeight: 800 }}>Suas metas diárias</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <Stat icon={<Flame size={16} />} label="Kcal" value={profile.calories ?? 0} accent />
            <Stat icon={<Drumstick size={16} />} label="Prot" value={`${profile.protein_g ?? 0}g`} />
            <Stat icon={<Wheat size={16} />} label="Carb" value={`${profile.carbs_g ?? 0}g`} />
            <Stat icon={<Droplet size={16} />} label="Gord" value={`${profile.fat_g ?? 0}g`} />
          </div>
        </div>
      </div>

      <SectionTitle>Recomendados para você</SectionTitle>
      <div className="h-scroll">
        {recommended.map(r => <RecipeCard key={r.id} recipe={r} compact />)}
      </div>

      <SectionTitle>Categorias</SectionTitle>
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {(Object.keys(CATEGORY_LABEL) as Recipe["category"][]).map(c => (
          <div key={c} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--gp)", color: "var(--gd)", display: "grid", placeItems: "center" }}>
              <ChefHat size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{CATEGORY_LABEL[c]}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{RECIPES.filter(r => r.category === c).length} receitas</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Topbar({ profile }: { profile: Profile }) {
  const initials = (profile.name ?? "FP").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "white", position: "sticky", top: 0, zIndex: 5 }}>
      <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.01em" }}>FIT <span style={{ color: "var(--gd)" }}>PRO</span></div>
      <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--gradient-brand)", color: "#052e1a", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>{initials}</div>
    </div>
  );
}
function SectionTitle({ children }: any) {
  return <h2 style={{ padding: "20px 20px 8px", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--ink-2)" }}>{children}</h2>;
}
function Stat({ icon, label, value, accent }: any) {
  return <div style={{ background: accent ? "var(--gradient-brand)" : "var(--bg)", color: accent ? "#052e1a" : "var(--ink)", padding: "10px 8px", borderRadius: 12, textAlign: "center" }}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, opacity: 0.85 }}>{icon}</div>
    <div style={{ fontWeight: 800, fontSize: 15 }}>{value}</div>
    <div style={{ fontSize: 10, opacity: 0.75, fontWeight: 600 }}>{label}</div>
  </div>;
}

/* ─────────── Recipes Tab ─────────── */
function RecipesTab({ profile, setProfile }: { profile: Profile; setProfile: (p: Profile) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Recipe["category"] | "all">("all");
  const [open, setOpen] = useState<Recipe | null>(null);
  const filtered = RECIPES.filter(r =>
    (cat === "all" || r.category === cat) &&
    (!q || r.name.toLowerCase().includes(q.toLowerCase()))
  );

  async function toggleFav(id: string) {
    const fav = profile.favorites.includes(id) ? profile.favorites.filter(x => x !== id) : [...profile.favorites, id];
    const { data } = await supabase.from("profiles").update({ favorites: fav }).eq("id", profile.id).select().single();
    if (data) setProfile(data as Profile);
  }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)" }} />
          <input className="input" placeholder="Buscar receita..." style={{ paddingLeft: 40 }} value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>
      <div className="h-scroll" style={{ marginTop: 12 }}>
        {(["all", ...Object.keys(CATEGORY_LABEL)] as const).map(k => (
          <button key={k} onClick={() => setCat(k as any)} className="chip" style={{
            background: cat === k ? "var(--gradient-brand)" : "var(--gp)",
            color: cat === k ? "#052e1a" : "var(--gd)",
            border: "none", cursor: "pointer", fontFamily: "inherit",
          }}>{k === "all" ? "Todas" : CATEGORY_LABEL[k as Recipe["category"]]}</button>
        ))}
      </div>
      <div style={{ padding: "16px 20px", display: "grid", gap: 12 }}>
        {filtered.map(r => (
          <button key={r.id} onClick={() => setOpen(r)} className="card" style={{ padding: 16, textAlign: "left", border: "1px solid var(--border)", background: "white", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", fontFamily: "inherit" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--gp)", color: "var(--gd)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <ChefHat size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{r.name}</div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)", flexWrap: "wrap" }}>
                <span style={{ display: "flex", gap: 4, alignItems: "center" }}><Flame size={12} />{r.kcal} kcal</span>
                <span style={{ display: "flex", gap: 4, alignItems: "center" }}><Clock size={12} />{r.time_min} min</span>
                <span style={{ display: "flex", gap: 4, alignItems: "center" }}><Drumstick size={12} />{r.protein}g</span>
              </div>
            </div>
            <Heart size={20} style={{ color: profile.favorites.includes(r.id) ? "oklch(0.65 0.22 25)" : "var(--muted-2)" }} fill={profile.favorites.includes(r.id) ? "currentColor" : "none"} onClick={(e) => { e.stopPropagation(); toggleFav(r.id); }} />
          </button>
        ))}
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Nenhuma receita encontrada.</div>}
      </div>
      {open && <RecipeModal recipe={open} onClose={() => setOpen(null)} fav={profile.favorites.includes(open.id)} onToggleFav={() => toggleFav(open.id)} />}
    </>
  );
}

function RecipeModal({ recipe, onClose, fav, onToggleFav }: { recipe: Recipe; onClose: () => void; fav: boolean; onToggleFav: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.02 250 / 0.55)", zIndex: 50, display: "grid", placeItems: "end", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", width: "100%", maxWidth: 460, maxHeight: "92dvh", borderRadius: "24px 24px 0 0", overflowY: "auto", animation: "slideUp .25s ease" }}>
        <div style={{ background: "var(--gradient-brand)", padding: "32px 22px 26px", color: "#052e1a", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "white", border: "none", width: 32, height: 32, borderRadius: 999, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={16} /></button>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "white", display: "grid", placeItems: "center", marginBottom: 12 }}><ChefHat size={28} style={{ color: "var(--gd)" }} /></div>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{recipe.name}</h2>
          <div style={{ display: "flex", gap: 12, fontSize: 12, marginTop: 8, opacity: 0.85, fontWeight: 600 }}>
            <span style={{ display: "flex", gap: 4, alignItems: "center" }}><Clock size={12} />{recipe.time_min} min</span>
            <span>{CATEGORY_LABEL[recipe.category]}</span>
          </div>
        </div>
        <div style={{ padding: 22, display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <Stat icon={<Flame size={14} />} label="kcal" value={recipe.kcal} accent />
            <Stat icon={<Drumstick size={14} />} label="prot" value={`${recipe.protein}g`} />
            <Stat icon={<Wheat size={14} />} label="carb" value={`${recipe.carbs}g`} />
            <Stat icon={<Droplet size={14} />} label="gord" value={`${recipe.fat}g`} />
          </div>
          <section>
            <h3 style={{ fontWeight: 800, marginBottom: 8, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Ingredientes</h3>
            <ul style={{ display: "grid", gap: 6, paddingLeft: 0, listStyle: "none" }}>
              {recipe.ingredients.map((i, k) => <li key={k} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--g)", marginTop: 8, flexShrink: 0 }} />{i}
              </li>)}
            </ul>
          </section>
          <section>
            <h3 style={{ fontWeight: 800, marginBottom: 8, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Modo de preparo</h3>
            <ol style={{ display: "grid", gap: 10, paddingLeft: 0, listStyle: "none", counterReset: "step" }}>
              {recipe.steps.map((s, k) => <li key={k} style={{ display: "flex", gap: 12, fontSize: 14 }}>
                <span style={{ width: 26, height: 26, borderRadius: 999, background: "var(--gp)", color: "var(--gd)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{k + 1}</span>
                {s}
              </li>)}
            </ol>
          </section>
          {recipe.tip && <div style={{ background: "var(--gp)", color: "var(--gd)", padding: 14, borderRadius: 12, fontSize: 13, display: "flex", gap: 8 }}>
            <Sparkle /><span><strong>Dica do Chef:</strong> {recipe.tip}</span>
          </div>}
          <button className={fav ? "btn-ghost" : "btn-primary"} onClick={onToggleFav}>
            <Heart size={16} fill={fav ? "currentColor" : "none"} /> {fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          </button>
        </div>
      </div>
    </div>
  );
}
function Sparkle() { return <span style={{ fontSize: 16, lineHeight: 1 }}>✨</span>; }

function RecipeCard({ recipe, compact }: { recipe: Recipe; compact?: boolean }) {
  return (
    <div className="card" style={{ width: 220, padding: 14 }}>
      <div style={{ height: 90, borderRadius: 12, background: "var(--gradient-brand)", display: "grid", placeItems: "center", color: "#052e1a", marginBottom: 10 }}>
        <ChefHat size={36} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>{recipe.name}</div>
      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--muted)" }}>
        <span style={{ display: "flex", gap: 3, alignItems: "center" }}><Flame size={11} />{recipe.kcal}</span>
        <span style={{ display: "flex", gap: 3, alignItems: "center" }}><Clock size={11} />{recipe.time_min}m</span>
      </div>
    </div>
  );
}

/* ─────────── Calc Tab ─────────── */
function CalcTab({ profile, setProfile }: { profile: Profile; setProfile: (p: Profile) => void }) {
  const [sex, setSex] = useState<Sex>(profile.sex ?? "male");
  const [age, setAge] = useState(profile.age ?? 28);
  const [height, setHeight] = useState(profile.height_cm ?? 175);
  const [weight, setWeight] = useState(profile.weight_kg ?? 75);
  const [goal, setGoal] = useState<Goal>(profile.goal ?? "maintain");
  const [activity, setActivity] = useState<ActivityT>(profile.activity ?? "moderate");
  const targets = calcTargets({ sex, age, height_cm: Number(height), weight_kg: Number(weight), goal, activity });

  async function save() {
    const { data } = await supabase.from("profiles").update({
      sex, age: Number(age), height_cm: Number(height), weight_kg: Number(weight), goal, activity, ...targets,
    }).eq("id", profile.id).select().single();
    if (data) setProfile(data as Profile);
  }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ padding: 20, display: "grid", gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Calcular metas</h2>
        <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
          <Options value={sex} onChange={(v) => setSex(v as Sex)} options={[{ v: "male", label: "Masculino" }, { v: "female", label: "Feminino" }]} />
          <Field label="Idade"><input className="input" type="number" value={age} onChange={e => setAge(+e.target.value)} /></Field>
          <Field label="Altura (cm)"><input className="input" type="number" value={height} onChange={e => setHeight(+e.target.value)} /></Field>
          <Field label="Peso (kg)"><input className="input" type="number" value={weight} onChange={e => setWeight(+e.target.value)} /></Field>
          <Field label="Objetivo">
            <select className="input" value={goal} onChange={e => setGoal(e.target.value as Goal)}>
              <option value="bulk">Ganhar massa</option><option value="cut">Perder gordura</option><option value="maintain">Manter forma</option>
            </select>
          </Field>
          <Field label="Atividade">
            <select className="input" value={activity} onChange={e => setActivity(e.target.value as ActivityT)}>
              <option value="sedentary">Sedentário</option><option value="light">Leve</option>
              <option value="moderate">Moderado</option><option value="active">Ativo</option>
              <option value="veryActive">Muito ativo</option>
            </select>
          </Field>
        </div>
        <ResultsCard targets={targets} />
        <button className="btn-primary" onClick={save}><Check size={16} /> Salvar metas</button>
      </div>
    </>
  );
}

/* ─────────── Profile Tab ─────────── */
function ProfileTab({ profile, setProfile }: { profile: Profile; setProfile: (p: Profile) => void }) {
  const nav = useNavigate();
  const favorites = RECIPES.filter(r => profile.favorites.includes(r.id));

  async function logout() {
    await supabase.auth.signOut();
    nav({ to: "/" });
  }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ padding: 20, display: "grid", gap: 16 }}>
        <div className="card" style={{ padding: 22, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: "var(--gradient-brand)", color: "#052e1a", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 22 }}>
            {(profile.name ?? "FP").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{profile.name ?? "—"}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{profile.goal ? GOAL_LABEL[profile.goal] : "—"} · {profile.activity ? ACT_LABEL[profile.activity] : "—"}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
          <h3 style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>Dados</h3>
          {[
            { Icon: UserIcon, label: "Sexo", value: profile.sex === "male" ? "Masculino" : profile.sex === "female" ? "Feminino" : "—" },
            { Icon: Activity, label: "Idade / Altura / Peso", value: `${profile.age ?? "—"}a · ${profile.height_cm ?? "—"}cm · ${profile.weight_kg ?? "—"}kg` },
            { Icon: Flame, label: "Calorias-alvo", value: `${profile.calories ?? 0} kcal` },
            { Icon: Drumstick, label: "Proteína", value: `${profile.protein_g ?? 0}g` },
          ].map(({ Icon, label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <Icon size={18} style={{ color: "var(--muted)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>{label}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 10 }}>Favoritos ({favorites.length})</h3>
          {favorites.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              Marque receitas com <Heart size={14} style={{ display: "inline", verticalAlign: "middle" }} /> para guardar aqui.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {favorites.map(r => (
                <div key={r.id} className="card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
                  <ChefHat size={20} style={{ color: "var(--gd)" }} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{r.kcal} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-ghost" onClick={logout} style={{ marginTop: 8 }}><LogOut size={16} /> Sair da conta</button>
      </div>
    </>
  );
}

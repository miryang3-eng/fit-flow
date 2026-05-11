import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "FIT PRO — Marmitas Fitness Gourmet | Chef Leonardo Ferrari" },
      { name: "description", content: "Marmitas fitness gourmet do Chef Leonardo Ferrari. Refeições saudáveis, saborosas e prontas para o seu dia." },
      { property: "og:title", content: "FIT PRO — Chef Leonardo Ferrari" },
      { property: "og:description", content: "Marmitas fitness gourmet, prontas em minutos." },
    ],
  }),
});

function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="bg-ink text-white text-center py-3 text-sm font-semibold">
        <span className="text-primary font-extrabold">FIT PRO</span> — Marmitas Fitness Gourmet do Chef Leonardo Ferrari
      </header>

      <section className="px-5 py-20 md:py-28 text-center max-w-5xl mx-auto">
        <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-primary text-xs font-bold tracking-wider uppercase mb-6">
          Novo · Edição limitada
        </span>
        <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight mb-6">
          Refeições <span className="text-primary">fitness gourmet</span><br />
          que cabem no seu dia.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Marmitas frescas, balanceadas e cheias de sabor — assinadas pelo Chef Leonardo Ferrari.
          Pronto em 3 minutos. Sem perder a forma. Sem perder o sabor.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#pedir" className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold text-base shadow-lg hover:bg-primary-glow transition">
            Quero experimentar
          </a>
          <a href="#cardapio" className="inline-flex items-center justify-center rounded-full border-2 border-border px-8 py-4 font-bold text-base hover:border-primary transition">
            Ver cardápio
          </a>
        </div>
      </section>

      <section id="cardapio" className="bg-muted px-5 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-12">
            Por que <span className="text-primary">FIT PRO</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: "Chef no comando", d: "Cada receita é desenvolvida pelo Chef Leonardo Ferrari, unindo técnica gourmet e nutrição clínica." },
              { t: "Macro calculado", d: "Proteínas, carboidratos e gorduras na medida certa para sua rotina e seus objetivos." },
              { t: "Pronto em 3 min", d: "Embalagem própria para micro-ondas. Tira do freezer, esquenta e está pronto." },
            ].map((c) => (
              <div key={c.t} className="bg-background rounded-2xl p-8 shadow-sm border border-border">
                <h3 className="font-display text-xl font-bold mb-2">{c.t}</h3>
                <p className="text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pedir" className="px-5 py-20 text-center">
        <div className="max-w-3xl mx-auto rounded-3xl bg-ink text-white p-12 shadow-xl">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4">
            Comece sua semana <span className="text-primary">FIT PRO</span>
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Monte seu kit semanal e receba em casa. Frete grátis em São Paulo capital.
          </p>
          <a href="#" className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-10 py-4 font-bold text-base shadow-lg hover:bg-primary-glow transition">
            Fazer meu pedido
          </a>
        </div>
      </section>

      <footer className="px-5 py-10 text-center text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} FIT PRO · Chef Leonardo Ferrari
      </footer>
    </main>
  );
}

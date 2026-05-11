import { createRootRoute, HeadContent, Outlet, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width,initial-scale=1.0" },
      { title: "FIT PRO — Chef Leonardo Ferrari" },
      { name: "description", content: "Marmitas fitness gourmet do Chef Leonardo Ferrari. Praticidade, sabor e nutrição em cada refeição." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h1>404</h1>
      <Link to="/">Voltar ao início</Link>
    </div>
  ),
});

function RootComponent() {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

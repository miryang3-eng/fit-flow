/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" },
      { title: "FIT PRO — Nutrição inteligente" },
      { name: "description", content: "Calcule suas metas, descubra receitas fit premium e acompanhe seu progresso." },
      { name: "theme-color", content: "#10b981" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: () => (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body><div id="app"><Outlet /></div><Scripts /></body>
    </html>
  ),
  notFoundComponent: () => (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>404</h1><a href="/">Voltar ao início</a>
    </div>
  ),
});

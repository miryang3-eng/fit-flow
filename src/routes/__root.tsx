import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>404</h1><br /><a href="/">Voltar ao início</a>
    </div>
  ),
});

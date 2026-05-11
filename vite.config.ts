/// <reference types="vite/client" />
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  server: { port: 8080, host: true },
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "./src") },
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
  ],
});

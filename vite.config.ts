import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// GitHub Pages serves project sites under /<repo>/ — set VITE_BASE in the
// Actions workflow so assets resolve correctly. Defaults to '/' for local dev
// and other hosts (Vercel, Netlify, Cloudflare Pages) that serve from root.
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

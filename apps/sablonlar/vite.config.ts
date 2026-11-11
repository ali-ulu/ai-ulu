import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Built as a static bundle and copied into the site output by scripts/build.mjs.
// `base: "./"` keeps every asset reference relative, so the gallery works both at
// the origin root (/sablonlar/) and under a GitHub Pages project path
// (/ai-ulu/sablonlar/) without a rebuild.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  build: { outDir: "dist", emptyOutDir: true },
})

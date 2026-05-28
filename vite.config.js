import {defineConfig} from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

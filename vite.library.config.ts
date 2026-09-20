import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/library",
    emptyOutDir: true,
    target: "es2022",
    lib: {
      entry: {
        index: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
        element: fileURLToPath(new URL("./src/element.tsx", import.meta.url)),
      },
      formats: ["es"],
      fileName: (_format, entry) => entry + ".js",
      cssFileName: "styles",
    },
    rollupOptions: { external: (id) => /^(react|react-dom)(\/|$)/.test(id) },
  },
})

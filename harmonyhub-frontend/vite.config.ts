import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (
              id.includes("@tiptap") ||
              id.includes("prosemirror") ||
              id.includes("orderedmap") ||
              id.includes("rope-sequence") ||
              id.includes("w3c-keyname")
            ) {
              return "tiptap";
            }
            if (id.includes("dompurify")) {
              return "sanitize";
            }
          }
          return undefined;
        },
      },
    },
  },
});

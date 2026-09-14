import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "src/app.ts"),
        styles: path.resolve(__dirname, "tailwind-source.css"),
      },
      output: {
        // The tooling lives outside web/ so that static content deploy never publishes it
        // (node_modules, sources, lockfile): only the built files are written into web/.
        dir: path.resolve(__dirname, "../../web"),
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "css/[name].[ext]",
      },
    },
    assetsInlineLimit: 0,
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  }
});

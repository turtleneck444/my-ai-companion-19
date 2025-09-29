import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];
  
  // Only add lovable-tagger in development mode
  if (mode === "development") {
    try {
      const { componentTagger } = require("lovable-tagger");
      plugins.push(componentTagger());
    } catch (e) {
      // lovable-tagger not available, skip it
      console.warn("lovable-tagger not available, skipping...");
    }
  }

  return {
    server: {
      host: "::",
      port: 5175,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { readdirSync } from "fs";
import path, { resolve } from "path";
import { defineConfig, type Plugin } from "vite";

function appSubrouteFallback(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url?.startsWith("/app/") && !req.url.includes(".")) {
      req.url = "/app/index.html";
    }
    next();
  };
  return {
    name: "app-subroute-fallback",
    configureServer: (s) => () => s.middlewares.use(rewrite),
    configurePreviewServer: (s) => () => s.middlewares.use(rewrite),
  };
}

const absolutePathAliases: { [key: string]: string } = {};
// Root resources folder
const srcPath = path.resolve("./src/");
// Ajust the regex here to include .vue, .js, .jsx, etc.. files from the resources/ folder
const srcRootContent = readdirSync(srcPath, { withFileTypes: true }).map(
  (dirent) => dirent.name.replace(/(\.ts){1}(x?)/, ""),
);

srcRootContent.forEach((directory) => {
  absolutePathAliases[directory] = path.join(srcPath, directory);
});

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr(), appSubrouteFallback()],
  resolve: {
    alias: {
      ...absolutePathAliases,
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        app: resolve(__dirname, "app/index.html"),
      },
    },
  },
  server: {
    port: 5170,
    proxy: {
      "/api/replicate": {
        target: "https://api.replicate.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/replicate/, ""),
      },
      "/api/elevenlabs": {
        target: "https://api.elevenlabs.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/elevenlabs/, ""),
      },
    },
  },
});

import { defineConfig } from "vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es", "umd"],
      name: "TechRadarEditor",
      fileName: (format) => `tech-radar-editor.${format}.js`,
    },
    cssCodeSplit: false, // Ensure all CSS is bundled together
  },
});

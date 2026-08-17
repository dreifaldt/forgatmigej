// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

/**
 * Server-renderad av ett skäl: tjänsten behöver en Node-process.
 *
 * Den statiska sajten kunde aldrig göra det som produkten lovar — ett urval som
 * överlever, ett tillstånd per begäran, och senare utskick. Därför node-adaptern
 * och därför inget GitHub Pages: Pages serverar filer, inte en server.
 */
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [svelte()],
  vite: { plugins: [tailwindcss()] },
});

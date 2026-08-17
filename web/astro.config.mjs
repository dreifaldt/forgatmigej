// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

/**
 * Statisk utdata, och det är inte en kompromiss.
 *
 * Appen har noll server-sida: inga API-rutter, ingen Astro.request, inga cookies.
 * Hela flödet — urval, kö, kvittens — lever i webbläsarens minne. Så länge det är
 * sant behövs ingen Node-process, och då ska vi inte betala för en.
 *
 * Konfigurationen stod på `output: "server"` med node-adaptern från när planen var
 * att skrapa tjänsternas sidor. Den planen föll på Cloudflares botskydd; kravet på
 * en server föll med den.
 *
 * Kommer riktig serverlogik tillbaka (utskick av e-post, ett tillstånd som
 * överlever omstart) är det här första filen att ändra — och då behövs ett riktigt
 * Node-hem igen.
 *
 * BASE: sajten serveras på dreifaldt.github.io/forgatmigej/, inte på en rot.
 * Står forgatmigej.dreifaldt.com en dag i DNS blir base "/" och CNAME läggs
 * tillbaka i artefakten. I dag pekar domänen ingenstans.
 */
export default defineConfig({
  site: "https://dreifaldt.github.io",
  base: "/forgatmigej",
  integrations: [svelte()],
  vite: { plugins: [tailwindcss()] },
});

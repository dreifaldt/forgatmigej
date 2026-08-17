/**
 * Länkar som överlever en base-sökväg.
 *
 * Sajten ligger på /forgatmigej/ hos GitHub Pages men på / under `astro dev` med
 * annan konfiguration, och en dag på en egen domäns rot. Hårdkodade "/ta-bort"
 * fungerar bara i ett av de fallen — och felar tyst i de andra, som en länk som
 * går till 404 utan att något ser trasigt ut.
 *
 * Normaliserar bort avslutande snedstreck ur BASE_URL innan den sätter ihop, så
 * att resultatet blir detsamma oavsett hur Astro råkar formatera värdet.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

export function path(relative: string): string {
  const clean = relative.replace(/^\/+/, "");
  return clean ? `${BASE}/${clean}` : `${BASE}/`;
}

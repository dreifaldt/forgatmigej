import { eniro, hitta, merinfo } from "@/providers/bankIdSites";
import { mrkoll } from "@/providers/mrkoll";
import { ratsit } from "@/providers/ratsit";
import { upplysning } from "@/providers/upplysning";
import type { RemovalProvider } from "./types";

/**
 * Registret är det enda stället som känner till vilka tjänster som finns.
 *
 * En ny tjänst läggs till genom att skriva en fil i src/providers och lägga den i
 * listan nedan. Ingenting i motorn, valvet, automationen eller UI:t behöver ändras.
 *
 * Ordningen är den användaren ser: Ratsit först, eftersom den är den enda vars sida
 * är läst och verifierad.
 */
const ALL: readonly RemovalProvider[] = [ratsit, mrkoll, hitta, merinfo, eniro, upplysning];

const BY_ID = new Map(ALL.map((p) => [p.id, p]));

export function allProviders(): readonly RemovalProvider[] {
  return ALL;
}

export function getProvider(id: string): RemovalProvider | undefined {
  return BY_ID.get(id);
}

export function requireProvider(id: string): RemovalProvider {
  const provider = BY_ID.get(id);
  if (!provider) throw new Error(`Okänd tjänst: ${id}`);
  return provider;
}

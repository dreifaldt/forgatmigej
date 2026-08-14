import { type FieldId, validate } from "./fields";
import type { FieldRequestRecord } from "./types";

/**
 * Valvet för en enskild borttagningsbegäran.
 *
 * Två regler, båda upprätthållna i runtime och inte bara i dokumentationen:
 *
 *  1. Ingen uppgift kan skrivas som inte först har efterfrågats av en provider.
 *     `set()` kastar annars. Det gör "samla in för säkerhets skull" till ett
 *     programmeringsfel i stället för ett policybrott ingen upptäcker.
 *  2. Allt kan raderas, och raderas när begäran är klar. Valvet lever i minnet.
 */
export class Vault {
  private readonly values = new Map<FieldId, string>();
  /** Alla begäranden per uppgift — två tjänster kan vilja ha samma sak av olika skäl. */
  private readonly requested = new Map<FieldId, FieldRequestRecord[]>();
  private scrubbed = false;

  /** Anteckna att en provider bett om uppgiften. Först därefter går den att fylla i. */
  markRequested(records: readonly FieldRequestRecord[]): void {
    this.assertLive();
    for (const rec of records) {
      const existing = this.requested.get(rec.fieldId);
      if (!existing) {
        this.requested.set(rec.fieldId, [rec]);
      } else if (!existing.some((r) => r.providerId === rec.providerId)) {
        existing.push(rec);
      }
    }
  }

  wasRequested(id: FieldId): boolean {
    return this.requested.has(id);
  }

  set(id: FieldId, value: string): void {
    this.assertLive();
    if (!this.requested.has(id)) {
      throw new Error(
        `Uppgiften "${id}" har inte efterfrågats av någon tjänst i den här begäran och får därför inte lagras.`,
      );
    }
    const problem = validate(id, value);
    if (problem) throw new Error(problem);
    this.values.set(id, value.trim());
  }

  get(id: FieldId): string | undefined {
    return this.values.get(id);
  }

  /** Ögonblicksbild för motorn. Motorn projicerar sedan ner den per provider. */
  snapshot(): Readonly<Partial<Record<FieldId, string>>> {
    return Object.freeze(Object.fromEntries(this.values) as Partial<Record<FieldId, string>>);
  }

  /** Vad som efterfrågats, av vem och varför. Underlag för kvittot till användaren. */
  receipts(): readonly FieldRequestRecord[] {
    return [...this.requested.values()].flat();
  }

  /** Raderar allt. Anropas när begäran är avslutad. */
  scrub(): void {
    this.values.clear();
    this.requested.clear();
    this.scrubbed = true;
  }

  get isScrubbed(): boolean {
    return this.scrubbed;
  }

  private assertLive(): void {
    if (this.scrubbed) throw new Error("Valvet är raderat och kan inte användas igen.");
  }
}

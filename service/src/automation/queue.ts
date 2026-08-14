import { newContext } from "./browser";
import { bankIdFlow } from "./bankIdFlow";
import type { BankIdFlowConfig } from "./config";
import type {
  AutomationHandle,
  FlowEvent,
  QueueItem,
  QueueItemState,
  ScrapeEvent,
} from "./types";

/**
 * Kön: en identifiering i taget.
 *
 * Att starta alla tjänsters inloggningar samtidigt vore fel på två sätt. Dels kan en
 * människa bara skanna en kod åt gången — resten hade hunnit gå ut medan hon höll på
 * med den första, eftersom ordern avbryts efter trettio sekunder. Dels blir det
 * obegripligt: fem koder på skärmen och ingen som vet vilken som gäller vad.
 *
 * Så: Ratsit först. Användaren legitimerar sig, den dolda webbläsaren klickar färdigt
 * hos Ratsit, och först när den är klar startar Hitta.se. En kod, ett namn, en tjänst.
 */

export interface QueueEntry {
  readonly providerId: string;
  readonly providerName: string;
  readonly config: BankIdFlowConfig;
  readonly collected: Readonly<Record<string, string>>;
}

class QueueRun implements AutomationHandle {
  private readonly listeners = new Set<(event: ScrapeEvent) => void>();
  private readonly buffer: ScrapeEvent[] = [];
  private readonly states = new Map<string, QueueItemState>();
  private stopped = false;
  private closeCurrent: (() => Promise<void>) | null = null;
  readonly finished: Promise<void>;

  constructor(
    readonly id: string,
    private readonly entries: readonly QueueEntry[],
    private readonly onProviderDone: (providerId: string) => void,
  ) {
    for (const entry of entries) this.states.set(entry.providerId, "pending");
    this.finished = this.run();
  }

  private snapshot(): readonly QueueItem[] {
    return this.entries.map((e) => ({
      providerId: e.providerId,
      providerName: e.providerName,
      state: this.states.get(e.providerId) ?? "pending",
    }));
  }

  private async run(): Promise<void> {
    this.push({ type: "queue", items: this.snapshot() });

    for (const entry of this.entries) {
      if (this.stopped) break;

      this.states.set(entry.providerId, "active");
      this.push({ type: "queue", items: this.snapshot() });
      this.push({
        providerId: entry.providerId,
        providerName: entry.providerName,
        type: "phase",
        phase: "starting",
        message: `Förbereder ${entry.providerName}`,
      });

      const outcome = await this.runOne(entry);
      this.states.set(entry.providerId, outcome);
      if (outcome === "done") this.onProviderDone(entry.providerId);
      this.push({ type: "queue", items: this.snapshot() });
    }

    const done = [...this.states.values()].filter((s) => s === "done").length;
    this.push({
      type: "all_done",
      message:
        done === this.entries.length
          ? "Alla tjänster är klara."
          : `${done} av ${this.entries.length} klara. Resten behöver din hjälp.`,
    });
  }

  private async runOne(entry: QueueEntry): Promise<QueueItemState> {
    const context = await newContext();
    this.closeCurrent = async () => {
      await context.close().catch(() => undefined);
    };

    let outcome: QueueItemState = "failed";

    try {
      const page = await context.newPage();
      const flow = bankIdFlow(entry.config);

      await flow({
        page,
        collected: entry.collected,
        cancelled: () => this.stopped,
        emit: (event: FlowEvent) => {
          if (event.type === "done") outcome = "done";
          if (event.type === "manual") outcome = "manual";
          if (event.type === "failed") outcome = "failed";
          this.push({
            providerId: entry.providerId,
            providerName: entry.providerName,
            ...event,
          });
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.push({
        providerId: entry.providerId,
        providerName: entry.providerName,
        type: "failed",
        message: `Vi kom inte igenom hos ${entry.providerName}: ${message}`,
      });
      outcome = "failed";
    } finally {
      await context.close().catch(() => undefined);
      this.closeCurrent = null;
    }

    return outcome;
  }

  private push(event: ScrapeEvent): void {
    // Bara den senaste koden och den senaste kölistan är värda att spara.
    if ("type" in event && event.type === "qr") {
      const index = this.buffer.findIndex((e) => "type" in e && e.type === "qr");
      if (index >= 0) this.buffer.splice(index, 1);
    }
    if (event.type === "queue") {
      const index = this.buffer.findIndex((e) => e.type === "queue");
      if (index >= 0) this.buffer.splice(index, 1);
    }
    this.buffer.push(event);
    if (this.buffer.length > 60) this.buffer.splice(0, this.buffer.length - 60);
    for (const listener of this.listeners) listener(event);
  }

  subscribe(listener: (event: ScrapeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  replay(): readonly ScrapeEvent[] {
    return [...this.buffer];
  }

  async cancel(): Promise<void> {
    this.stopped = true;
    await this.closeCurrent?.();
  }
}

const runs = new Map<string, QueueRun>();

export function startQueue(
  requestId: string,
  entries: readonly QueueEntry[],
  onProviderDone: (providerId: string) => void,
): AutomationHandle {
  const existing = runs.get(requestId);
  if (existing) return existing;

  const run = new QueueRun(requestId, entries, onProviderDone);
  runs.set(requestId, run);
  void run.finished.finally(() => {
    // Låt bufferten ligga kvar en stund så att en sen klient hinner läsa slutresultatet.
    setTimeout(() => runs.delete(requestId), 60_000);
  });
  return run;
}

export function getQueue(requestId: string): AutomationHandle | undefined {
  return runs.get(requestId);
}

export async function cancelQueue(requestId: string): Promise<void> {
  const run = runs.get(requestId);
  if (run) {
    await run.cancel();
    runs.delete(requestId);
  }
}

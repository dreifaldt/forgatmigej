import type { BankIdFlowConfig } from "@/automation/config";
import { getQueue, startQueue, type QueueEntry } from "@/automation/queue";
import type { ScrapeEvent } from "@/automation/types";
import { scopeContextToProvider } from "@/core/engine";
import { requireProvider } from "@/core/registry";
import { advanceAll, confirmUserAction } from "@/core/service";
import { store } from "@/core/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Strömmar hela körningen: kölistan, vilken tjänst som är igång, dess kod, och vad den
 * dolda webbläsaren gör just nu.
 *
 * Server-sent events, inte polling, eftersom koden byts varje sekund och en missad
 * uppdatering betyder en kod som redan hunnit bli ogiltig.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const removalRequest = store.get(id);
  if (!removalRequest) return new Response("Okänd begäran.", { status: 404 });

  /**
   * Övningsläge. Är FMN_MOCK_BANKID_URL satt körs exakt samma flödeskod mot den lokala
   * övningssajten i stället för mot de skarpa tjänsterna.
   */
  const mockUrl = process.env.FMN_MOCK_BANKID_URL;

  const entries: QueueEntry[] = removalRequest.providerIds
    .map((providerId) => ({ providerId, provider: requireProvider(providerId) }))
    .filter(({ provider }) => Boolean(provider.automation))
    .filter(({ providerId }) => {
      const status = removalRequest.runs[providerId]?.context.status;
      return status !== "SUBMITTED" && status !== "CONFIRMED";
    })
    .map(({ providerId, provider }) => {
      const base = provider.automation!.config;
      const config = mockUrl ? mockConfig(provider.name, mockUrl) : base;

      // Providern får bara de uppgifter den själv deklarerat, även här.
      const run = removalRequest.runs[providerId];
      const scoped = run
        ? scopeContextToProvider(provider, { ...run.context, collected: removalRequest.vault.snapshot() })
        : null;

      return {
        providerId,
        providerName: provider.name,
        config,
        collected: (scoped?.collected ?? {}) as Readonly<Record<string, string>>,
      };
    });

  if (entries.length === 0) {
    return new Response("Ingenting att identifiera sig mot.", { status: 400 });
  }

  const handle =
    getQueue(id) ??
    startQueue(id, entries, (providerId) => {
      confirmUserAction(removalRequest, providerId);
      void advanceAll(removalRequest);
    });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (event: ScrapeEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };

      for (const event of handle.replay()) send(event);

      const unsubscribe = handle.subscribe((event) => {
        send(event);
        if (event.type === "all_done") {
          setTimeout(() => {
            unsubscribe();
            if (!closed) {
              closed = true;
              try {
                controller.close();
              } catch {
                // Redan stängd.
              }
            }
          }, 200);
        }
      });

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        closed = true;
      });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

/**
 * Konfiguration mot övningssajten.
 *
 * Medvetet en *egen* konfiguration i stället för tjänsternas riktiga selektorer med bara
 * adressen utbytt. Poängen med mocken är att verifiera maskineriet — navigera, hitta
 * koden, strömma den, upptäcka inloggningen, fylla i formuläret, bekräfta — inte att
 * låtsas att Ratsits ogissade selektorer fungerar. Att köra dem mot en sida de inte är
 * skrivna för hade bevisat ingenting.
 */
function mockConfig(providerName: string, mockUrl: string): BankIdFlowConfig {
  const url = new URL(mockUrl);
  url.searchParams.set("provider", providerName);

  return {
    providerName,
    startUrl: url.toString(),
    startTriggers: ['button:has-text("Ta bort dig")'],
    successSignals: [':text("Du är inloggad")'],
    postAuthSteps: [
      {
        kind: "check",
        selectors: ['input[name="samtycke"]'],
        label: `Kryssar i samtycket hos ${providerName}`,
      },
      {
        kind: "click",
        selectors: ['button:has-text("Bekräfta borttagning")'],
        label: `Skickar begäran till ${providerName}`,
      },
    ],
    completionSignals: [':text("Din begäran är mottagen")'],
    verified: true,
    manualInstructions: ["Övningsläge — inga instruktioner behövs."],
  };
}

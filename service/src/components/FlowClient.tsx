"use client";

import { useCallback, useState } from "react";
import type { RequestView } from "@/core/view";
import { DonePanel } from "./DonePanel";
import { FieldRequest } from "./FieldRequest";
import { IdentifyModal } from "./IdentifyModal";
import { StatusCard } from "./StatusCard";

export function FlowClient({ initial }: { initial: RequestView }) {
  const [view, setView] = useState(initial);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [identifying, setIdentifying] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/requests/${view.id}`);
    if (response.ok) setView((await response.json()) as RequestView);
  }, [view.id]);

  async function submitAnswers() {
    setBusy(true);
    const response = await fetch(`/api/requests/${view.id}/answers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = (await response.json()) as {
      view: RequestView;
      rejected: { id: string; problem: string }[];
    };
    setErrors(Object.fromEntries(data.rejected.map((r) => [r.id, r.problem])));
    setAnswers({});
    setView(data.view);
    setBusy(false);
  }

  async function confirm(providerId: string) {
    setBusy(true);
    const response = await fetch(`/api/requests/${view.id}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId }),
    });
    setView((await response.json()) as RequestView);
    setBusy(false);
  }

  const asking = view.pendingFields.length > 0;

  /** Tjänster som fortfarande behöver att användaren legitimerar sig. Kön tar dem i tur. */
  const awaitingIdentification = view.providers.filter(
    (p) => p.automated && p.status !== "SUBMITTED" && p.status !== "CONFIRMED",
  );

  return (
    <main className="pb-24">
      <header className="flex items-center justify-between pt-6">
        <span className="font-serif text-xl font-medium">Förgätmigej</span>
        <span className="text-xs uppercase tracking-[0.14em] text-stem">Din borttagning</span>
      </header>

      {view.complete ? (
        <section className="pt-14">
          <DonePanel
            requestId={view.id}
            providerIds={view.providers.map((p) => p.id)}
            providerNames={view.providers.map((p) => p.name)}
          />
        </section>
      ) : (
        <section className="pt-14">
          <h1 className="font-serif text-[clamp(28px,5vw,44px)] leading-tight font-light">
            {asking ? "Vi behöver något av dig" : "Din borttagning"}
          </h1>
          <p className="mt-4 text-stem">
            {view.summary.total} tjänster · {view.summary.done} klara · {view.summary.waiting}{" "}
            pågår · {view.summary.manual} behöver din hjälp
          </p>
        </section>
      )}

      {asking && (
        <section className="pt-10">
          <div className="grid gap-4">
            {view.pendingFields.map((field) => (
              <FieldRequest
                key={field.id}
                field={field}
                value={answers[field.id] ?? ""}
                {...(errors[field.id] ? { error: errors[field.id] } : {})}
                onChange={(value) => setAnswers((prev) => ({ ...prev, [field.id]: value }))}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={submitAnswers}
            disabled={busy}
            className="mt-6 rounded-full bg-blue-deep px-6 py-3 font-medium text-ring transition hover:bg-blue-hover disabled:opacity-40"
          >
            {busy ? "Skickar…" : "Fortsätt"}
          </button>

          <p className="mt-4 max-w-[52ch] text-sm text-stem">
            Vi sparar inget längre än begäran lever, och skickar aldrig en uppgift till en tjänst
            som inte har bett om den.
          </p>
        </section>
      )}

      {/* Inte beroende av frågorna ovan. Tjänsterna i kön behöver inga uppgifter, så de
          ska inte stå och vänta på ett formulär för en helt annan tjänst. */}
      {awaitingIdentification.length > 0 && (
        <section className="pt-10">
          <div className="rounded-2xl border border-[var(--color-line)] bg-surface p-6">
            <h2 className="font-serif text-xl">
              {awaitingIdentification.length === 1
                ? `${awaitingIdentification[0]?.name} vill veta att det är du`
                : `${awaitingIdentification.length} tjänster vill veta att det är du`}
            </h2>
            <p className="mt-2 max-w-[54ch] text-sm text-stem">
              Vi öppnar tjänsternas sidor åt dig och hämtar deras koder hit — en i taget. Du
              legitimerar dig i din egen app, resten fyller vi i.
            </p>
            <button
              type="button"
              onClick={() => setIdentifying(true)}
              className="mt-5 rounded-full bg-blue-deep px-6 py-3 font-medium text-ring transition hover:bg-blue-hover"
            >
              Sätt igång
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-3 pt-12">
        {view.providers.map((provider) => (
          <StatusCard key={provider.id} provider={provider} busy={busy} onConfirm={confirm} />
        ))}
      </section>

      {view.receipts.length > 0 && (
        <section className="pt-14">
          <h2 className="font-serif text-2xl font-light">Vad vi har frågat efter</h2>
          <p className="mt-2 max-w-[52ch] text-sm text-stem">
            Varje rad är en uppgift någon tjänst begärt, och skälet den angav. Inget utanför den
            här listan har efterfrågats.
          </p>
          <ul className="mt-5 grid gap-2">
            {view.receipts.map((r) => (
              <li
                key={`${r.providerName}-${r.fieldId}`}
                className="rounded-xl border border-[var(--color-line)] bg-surface px-4 py-3 text-sm"
              >
                <span className="font-medium">{r.fieldId}</span>
                <span className="text-stem">
                  {" "}
                  — {r.providerName}: {r.reason}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {identifying && (
        <IdentifyModal
          requestId={view.id}
          onClose={() => {
            setIdentifying(false);
            void refresh();
          }}
          onProgress={refresh}
        />
      )}
    </main>
  );
}

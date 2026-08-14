"use client";

import { useEffect, useRef, useState } from "react";
import type { QueueItem, ScrapeEvent, SessionPhase } from "@/automation/types";

/**
 * Identifieringen som användaren ser den.
 *
 * En tjänst i taget. Stort namn på tjänsten koden gäller, koden under, och en kölista
 * bredvid så att man ser vad som är gjort och vad som står på tur.
 *
 * Namnet på tjänsten står stort med flit. En kod utan avsändare är precis den form ett
 * bedrägeri tar, och det enda som skiljer är att användaren här vet vem hon legitimerar
 * sig mot. Den raden får inte tonas ner för att spara plats.
 */
const PHASE_TEXT: Record<SessionPhase, string> = {
  starting: "Förbereder",
  navigating: "Öppnar tjänstens sida",
  locating: "Letar upp inloggningen",
  awaiting_scan: "Väntar på dig",
  verifying: "Inloggad",
  submitting: "Fyller i resten åt dig",
  done: "Klart",
  manual: "Behöver din hjälp",
  failed: "Gick inte",
};

export function IdentifyModal({
  requestId,
  onClose,
  onProgress,
}: {
  requestId: string;
  onClose: () => void;
  onProgress: () => void;
}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [active, setActive] = useState<{ id: string; name: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);
  const [phase, setPhase] = useState<SessionPhase>("starting");
  const [message, setMessage] = useState("Förbereder…");
  const [manual, setManual] = useState<{ url: string; instructions: string[] } | null>(null);
  const [allDone, setAllDone] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const source = new EventSource(`/api/requests/${requestId}/automation`);

    source.onmessage = (raw) => {
      const event = JSON.parse(raw.data) as ScrapeEvent;

      if (event.type === "queue") {
        setQueue([...event.items]);
        const current = event.items.find((i) => i.state === "active");
        if (current) {
          setActive((prev) => {
            // Ny tjänst på tur — släng föregående kod direkt.
            if (prev?.id !== current.providerId) {
              setQr(null);
              setExpiresInMs(null);
              setManual(null);
            }
            return { id: current.providerId, name: current.providerName };
          });
        }
        return;
      }

      if (event.type === "all_done") {
        setAllDone(event.message);
        setQr(null);
        source.close();
        onProgress();
        return;
      }

      setActive({ id: event.providerId, name: event.providerName });

      if (event.type === "phase") {
        setPhase(event.phase);
        setMessage(event.message);
      } else if (event.type === "qr") {
        setQr(event.frame.dataUrl);
        setExpiresInMs(event.expiresInMs);
      } else if (event.type === "done") {
        setPhase("done");
        setMessage(event.message);
        setQr(null);
        onProgress();
      } else if (event.type === "manual") {
        setPhase("manual");
        setMessage(event.message);
        setManual({ url: event.url, instructions: [...event.instructions] });
        setQr(null);
      } else if (event.type === "failed") {
        setPhase("failed");
        setMessage(event.message);
        setQr(null);
      }
    };

    source.onerror = () => source.close();
    return () => source.close();
  }, [requestId, onProgress]);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const seconds = expiresInMs === null ? null : Math.max(0, Math.round(expiresInMs / 1000));
  const remaining = queue.filter((i) => i.state === "pending").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-6">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="identify-title"
        className="w-full max-w-[480px] rounded-3xl border border-[var(--color-line)] bg-surface p-8 outline-none"
      >
        {allDone ? (
          <>
            <h2 id="identify-title" className="font-serif text-2xl font-light">
              {allDone}
            </h2>
            <ul className="mt-5 grid gap-2">
              {queue.map((item) => (
                <QueueRow key={item.providerId} item={item} />
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.16em] text-stem">Du tas bort från</p>
            <h2 id="identify-title" className="mt-1 font-serif text-3xl font-light">
              {active?.name ?? "…"}
            </h2>

            <div className="mt-6 flex flex-col items-center">
              {qr ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qr}
                    alt={`Kod för att legitimera dig hos ${active?.name ?? "tjänsten"}`}
                    width={220}
                    height={220}
                    className="rounded-xl border border-[var(--color-line)] bg-ring"
                  />
                  <p className="mt-3 text-center text-sm">
                    Skanna koden för att legitimera dig hos {active?.name}
                  </p>
                  <p className="mt-1 text-xs text-stem">
                    Koden byts varje sekund
                    {seconds !== null && seconds > 0 ? ` · går ut om ${seconds} s` : ""}
                  </p>
                </>
              ) : (
                <div
                  className="flex h-[220px] w-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--color-line)]"
                  aria-live="polite"
                >
                  <Spinner />
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-ground p-4" aria-live="polite">
              <p className="text-sm font-medium">{PHASE_TEXT[phase]}</p>
              <p className="mt-1 text-sm text-stem">{message}</p>
            </div>

            {manual && (
              <div className="mt-5">
                <ol className="list-decimal space-y-1 pl-5 text-sm text-stem">
                  {manual.instructions.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
                <a
                  href={manual.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-block rounded-full bg-blue-deep px-5 py-2.5 text-sm font-medium text-ring hover:bg-blue-hover"
                >
                  Öppna {active?.name}
                </a>
              </div>
            )}

            {queue.length > 1 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.12em] text-stem">
                  {remaining > 0 ? `${remaining} kvar efter den här` : "Sista tjänsten"}
                </p>
                <ul className="mt-3 grid gap-2">
                  {queue.map((item) => (
                    <QueueRow key={item.providerId} item={item} />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm hover:bg-ground"
        >
          {allDone ? "Stäng" : "Avbryt"}
        </button>
      </div>
    </div>
  );
}

function QueueRow({ item }: { item: QueueItem }) {
  const label =
    item.state === "done"
      ? "Klart"
      : item.state === "active"
        ? "Pågår"
        : item.state === "manual"
          ? "Behöver dig"
          : item.state === "failed"
            ? "Gick inte"
            : "Står på tur";

  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        aria-hidden
        className={`h-2 w-2 flex-none rounded-full ${
          item.state === "done"
            ? "bg-blue-deep"
            : item.state === "active"
              ? "bg-blue"
              : item.state === "manual" || item.state === "failed"
                ? "bg-eye"
                : "bg-faded"
        }`}
      />
      <span className={item.state === "active" ? "font-medium" : ""}>{item.providerName}</span>
      <span className="ml-auto text-stem">{label}</span>
    </li>
  );
}

function Spinner() {
  return (
    <span className="relative flex h-10 w-10" aria-label="Arbetar">
      <span className="absolute inset-0 animate-ping rounded-full bg-blue-pale opacity-60" />
      <span className="relative m-auto h-3 w-3 rounded-full bg-blue-deep" />
    </span>
  );
}

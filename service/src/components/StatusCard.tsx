"use client";

import type { ProviderView } from "@/core/view";

/**
 * Statusmarkören är avsiktligt inte färgkodad i rosa.
 *
 * Palettregel 3: --color-bud markerar exakt ett tillstånd, utgången spärr. Tjänsten
 * har ännu ingen nedräkning, så knoppen används inte alls här. Att låta den betyda
 * "misslyckades" hade gett den en andra innebörd och brutit regeln.
 */
function Marker({ status }: { status: string }) {
  const done = status === "SUBMITTED" || status === "CONFIRMED";
  const needsUser = status === "MANUAL_ACTION_REQUIRED" || status === "AUTHENTICATION_REQUIRED";

  return (
    <span
      aria-hidden
      className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${
        done ? "bg-blue-deep" : needsUser ? "bg-eye" : "bg-faded"
      }`}
    />
  );
}

export function StatusCard({
  provider,
  busy,
  onConfirm,
}: {
  provider: ProviderView;
  busy: boolean;
  onConfirm: (providerId: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--color-line)] bg-surface p-5">
      <div className="flex items-start gap-3">
        <Marker status={provider.status} />
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-serif text-lg">{provider.name}</h3>
            <span className="text-sm text-stem">{provider.statusLabel}</span>
          </div>

          <p className="mt-1 text-sm text-stem">{provider.summary}</p>

          {provider.pending.kind === "need_user_action" && (
            <div className="mt-4">
              {/* Automatiserade tjänster hanteras av kön ovan — inga knappar per kort,
                  eftersom en identifiering i taget är hela poängen. */}
              {!provider.automated && (
                <>
                  <p className="max-w-[52ch] text-sm">{provider.pending.note}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {provider.pending.url && (
                      <a
                        href={provider.pending.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="rounded-full bg-blue-deep px-5 py-2.5 text-sm font-medium text-ring transition hover:bg-blue-hover"
                      >
                        Öppna {provider.name}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onConfirm(provider.id)}
                      disabled={busy}
                      className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm transition hover:bg-ground disabled:opacity-40"
                    >
                      Jag gjorde det själv
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {provider.pending.kind === "manual" && (
            <div className="mt-4">
              <p className="text-sm font-medium">{provider.pending.note}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-stem">
                {provider.pending.instructions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={provider.pending.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full bg-blue-deep px-5 py-2.5 text-sm font-medium text-ring transition hover:bg-blue-hover"
                >
                  Öppna {provider.name}
                </a>
                <button
                  type="button"
                  onClick={() => onConfirm(provider.id)}
                  disabled={busy}
                  className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm transition hover:bg-ground disabled:opacity-40"
                >
                  Jag är klar med steget
                </button>
              </div>
            </div>
          )}

          {provider.pending.kind === "settled" && provider.pending.note && (
            <p className="mt-3 max-w-[52ch] text-sm text-stem">{provider.pending.note}</p>
          )}

          {provider.pending.kind === "need_information" && (
            <p className="mt-3 text-sm text-stem">Väntar på uppgifterna ovan.</p>
          )}
        </div>
      </div>
    </article>
  );
}

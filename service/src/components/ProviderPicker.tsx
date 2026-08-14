"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface PickerProvider {
  id: string;
  name: string;
  summary: string;
  authenticationMethod: string;
  validForDays: number | null;
  upfrontFieldCount: number;
}

/**
 * Ingen metod-etikett på korten.
 *
 * Vilken teknik en tjänst råkar använda för att känna igen dig är vårt problem, inte
 * ditt. Det enda som är värt att veta när man väljer är vad tjänsten visar om en, och
 * om vi behöver fråga om något.
 */
export function ProviderPicker({ providers }: { providers: PickerProvider[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set(providers.map((p) => p.id)));
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function start() {
    setBusy(true);
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerIds: [...picked] }),
    });
    const data = (await response.json()) as { id: string };
    router.push(`/flow/${data.id}`);
  }

  return (
    <section className="pt-12">
      <ul className="grid gap-3">
        {providers.map((p) => {
          const on = picked.has(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={on}
                className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${
                  on ? "border-blue bg-surface" : "border-[var(--color-line)] bg-surface/60"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-[6px] border-[1.5px] ${
                    on ? "border-blue-deep bg-blue-deep" : "border-[var(--color-faded)]"
                  }`}
                >
                  {on && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                      <path
                        d="M2.5 6.2 5 8.6l4.5-5"
                        stroke="var(--color-ring)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>

                <span className="flex-1">
                  <span className="font-serif text-lg">{p.name}</span>
                  <span className="mt-1 block text-sm text-stem">{p.summary}</span>
                  <span className="mt-2 block text-sm">
                    {p.upfrontFieldCount === 0 ? (
                      <span className="text-blue-deep">Vi behöver inte fråga dig om något.</span>
                    ) : (
                      <span className="text-stem">
                        Vi behöver fråga om {p.upfrontFieldCount} sak
                        {p.upfrontFieldCount === 1 ? "" : "er"}.
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex items-center gap-5">
        <button
          type="button"
          onClick={start}
          disabled={picked.size === 0 || busy}
          className="rounded-full bg-blue-deep px-6 py-3 font-medium text-ring transition hover:bg-blue-hover disabled:opacity-40"
        >
          {busy ? "Startar…" : "Fortsätt"}
        </button>
        <span className="text-sm text-stem">
          {picked.size} tjänst{picked.size === 1 ? "" : "er"} valda
        </span>
      </div>
    </section>
  );
}

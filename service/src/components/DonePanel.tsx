"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Slutskärmen.
 *
 * Frestelsen här är att skriva "Klart!" och sluta. Det vore osant på tre sätt, och alla
 * tre står i klartext i stället:
 *
 *  1. Tjänsterna raderar inte, de döljer. Uppgifterna ligger kvar i deras register.
 *  2. De hämtar nya uttag ur offentliga register, så en dold profil kan återskapas utan
 *     att någon gjort något fel.
 *  3. Ingen av tjänsterna publicerar hur länge en spärr faktiskt gäller. Vi lovar därför
 *     ingen tid — vi säger "titta till det ett par gånger om året", vilket är det enda
 *     som går att belägga. Att bevaka det åt användaren är en senare feature, inte MVP.
 *
 * Och så det viktigaste: att göra om det ska vara en knapp, inte ett projekt.
 */
export function DonePanel({
  requestId,
  providerIds,
  providerNames,
}: {
  requestId: string;
  providerIds: string[];
  providerNames: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function again() {
    setBusy(true);
    // Ny begäran med samma tjänster. Den gamla raderas — valvet töms med den.
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerIds }),
    });
    const data = (await response.json()) as { id: string };
    void fetch(`/api/requests/${requestId}`, { method: "DELETE" });
    router.push(`/flow/${data.id}`);
  }

  return (
    <section className="rounded-3xl border border-[var(--color-line)] bg-surface p-8">
      <p className="text-xs uppercase tracking-[0.16em] text-stem">Klart</p>
      <h2 className="mt-2 font-serif text-[clamp(26px,4.4vw,38px)] leading-tight font-light">
        Alla begäranden är skickade
      </h2>

      <p className="mt-4 max-w-[54ch] text-stem">
        {providerNames.length === 1
          ? `${providerNames[0]} har fått din begäran.`
          : `${providerNames.slice(0, -1).join(", ")} och ${providerNames.at(-1)} har fått din begäran.`}{" "}
        Du behöver inte göra något mer just nu.
      </p>

      <div className="mt-7 border-t border-[var(--color-line)] pt-6">
        <h3 className="font-serif text-xl">Men det är inte gjort en gång för alla</h3>
        <p className="mt-3 max-w-[54ch] text-stem">
          Tjänsterna raderar dig inte — de döljer dig. Uppgifterna ligger kvar hos dem, och de
          hämtar nya uttag ur offentliga register med jämna mellanrum. Du kan alltså dyka upp
          igen utan att någon gjort något fel.
        </p>
        <p className="mt-3 max-w-[54ch] text-stem">
          Ingen av tjänsterna säger öppet hur länge en spärr gäller, så vi lovar ingen tid.
          Sök på ditt eget namn ett par gånger om året. Hittar du dig själv igen är det bara
          att skicka en ny begäran härifrån — det tar lika kort tid som nu.
        </p>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={again}
          disabled={busy}
          className="rounded-full bg-blue-deep px-6 py-3 font-medium text-ring transition hover:bg-blue-hover disabled:opacity-40"
        >
          {busy ? "Startar…" : "Skicka en ny begäran"}
        </button>
      </div>
    </section>
  );
}

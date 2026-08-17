<script lang="ts">
  import type { Site } from "../lib/sites";

  /**
   * Var i kön användaren befinner sig.
   *
   * Segment i stället för numrerade cirklar med streck emellan: med sex sajter blir
   * cirklarna små och etiketterna oläsliga, medan en delad list visar både hur långt
   * det är kvar och vad varje sajt heter utan att trängas.
   *
   * Ingen rosa här. Regel 3 ger --color-bud exakt en betydelse (utgången spärr) och
   * ett överhoppat steg är inte den — därför bär "Hoppades över" samma dämpade grå
   * som "Står på tur".
   */
  let {
    queue,
    index,
    completed,
  }: {
    queue: readonly Site[];
    index: number;
    completed: readonly string[];
  } = $props();

  const total = $derived(queue.length);
  const done = $derived(queue.filter((s) => completed.includes(s.id)).length);
  const remaining = $derived(Math.max(0, total - done));

  function stateOf(site: Site, i: number): "done" | "current" | "pending" {
    if (completed.includes(site.id)) return "done";
    if (i === index) return "current";
    return "pending";
  }

  // Korta med flit: med sex sajter på en telefon får varje kolumn ~55 px, och
  // "Står på tur" kapades till "Står på t…". Tre ord som alla får plats i stället.
  const LABEL = { done: "Klar", current: "Pågår", pending: "På tur" } as const;
</script>

<nav aria-label="Så långt har du kommit" class="w-full">
  <div class="flex items-baseline justify-between gap-4">
    <p class="text-xs tracking-[0.14em] text-stem uppercase">
      Sajt {Math.min(index + 1, total)} av {total}
    </p>
    <p class="text-xs text-stem">
      {#if remaining === 0}
        Allt avklarat
      {:else}
        {remaining} kvar
      {/if}
    </p>
  </div>

  <ol class="mt-3 flex gap-2">
    {#each queue as site, i}
      {@const state = stateOf(site, i)}
      <li class="min-w-0 flex-1" aria-current={state === "current" ? "step" : undefined}>
        <span
          aria-hidden="true"
          class="block h-[3px] rounded-full {state === 'done'
            ? 'bg-blue-deep'
            : state === 'current'
              ? 'bg-blue'
              : 'bg-[var(--color-line)]'}"
        ></span>
        <span
          class="mt-2 block truncate text-[12.5px] {state === 'pending'
            ? 'text-stem'
            : 'font-medium'}"
          title={site.name}>{site.name}</span
        >
        <span class="block truncate text-[11px] text-stem">{LABEL[state]}</span>
      </li>
    {/each}
  </ol>
</nav>

<script lang="ts">
  import RemovalLauncher from "./RemovalLauncher.svelte";
  import type { Site } from "../lib/sites";

  /**
   * Urval → en sajt i taget → kvittens.
   *
   * En i taget är inte en begränsning utan poängen. Sex öppnade fönster samtidigt
   * är obegripligt, och den som ska legitimera sig hinner ändå bara med ett.
   */
  let { sites }: { sites: readonly Site[] } = $props();

  // Bara Ratsit förvald. Den är den enda vars sida vi läst av, alltså den enda
  // vi kan ge exakta steg för. Att förvälja sex och bara kunna guida en vore att
  // lova mer än vi håller.
  let picked = $state<string[]>(["ratsit"]);
  let stage = $state<"pick" | "run" | "done">("pick");
  let index = $state(0);
  let completed = $state<string[]>([]);

  const chosen = $derived(sites.filter((s) => picked.includes(s.id)));
  const current = $derived(chosen[index]);

  function toggle(id: string) {
    picked = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
  }

  function start() {
    index = 0;
    completed = [];
    stage = "run";
  }

  function next() {
    if (current) completed = [...completed, current.id];
    if (index + 1 < chosen.length) index += 1;
    else stage = "done";
  }

  function restart() {
    stage = "pick";
    index = 0;
    completed = [];
  }
</script>

{#if stage === "pick"}
  <section class="mx-auto w-full max-w-[620px] px-5 py-12">
    <h1 class="font-serif text-[clamp(26px,4.4vw,34px)] leading-tight font-light">
      Var vill du bort ifrån?
    </h1>
    <p class="mt-3 text-stem">
      Vi tar en sajt i taget och står kvar med instruktionerna medan du gör den.
    </p>

    <ul class="mt-8 grid gap-3">
      {#each sites as site}
        {@const on = picked.includes(site.id)}
        <li>
          <button
            type="button"
            onclick={() => toggle(site.id)}
            aria-pressed={on}
            class="flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition {on
              ? 'border-blue bg-surface'
              : 'border-[var(--color-line)] bg-surface/60'}"
          >
            <span
              aria-hidden="true"
              class="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-[6px] border-[1.5px] {on
                ? 'border-blue-deep bg-blue-deep'
                : 'border-[var(--color-faded)]'}"
            >
              {#if on}
                <svg viewBox="0 0 12 12" class="h-3 w-3" fill="none">
                  <path
                    d="M2.5 6.2 5 8.6l4.5-5"
                    stroke="var(--color-ring)"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {/if}
            </span>

            <span class="flex-1">
              <span class="font-serif text-lg">{site.name}</span>
              <span class="mt-1 block text-sm text-stem">{site.does}</span>
              <span class="mt-2 block text-sm">
                {#if site.verified}
                  <span class="text-blue-deep">Vi kan guida dig steg för steg.</span>
                {:else}
                  <span class="text-stem">Vi öppnar sidan — stegen står hos dem.</span>
                {/if}
              </span>
            </span>
          </button>
        </li>
      {/each}
    </ul>

    <div class="mt-8 flex flex-wrap items-center gap-5">
      <button
        type="button"
        onclick={start}
        disabled={picked.length === 0}
        class="rounded-full bg-blue-deep px-6 py-3 font-medium text-ring transition hover:bg-blue-hover disabled:opacity-40"
      >
        Fortsätt
      </button>
      <span class="text-sm text-stem">
        {picked.length} sajt{picked.length === 1 ? "" : "er"} vald{picked.length === 1
          ? ""
          : "a"}
      </span>
    </div>
  </section>
{:else if stage === "run" && current}
  <RemovalLauncher site={current} onback={restart} ondone={next} />
{:else}
  <section class="mx-auto w-full max-w-[560px] px-5 py-14">
    <p class="text-xs tracking-[0.16em] text-stem uppercase">Klart</p>
    <h1 class="mt-2 font-serif text-[clamp(26px,4.4vw,36px)] leading-tight font-light">
      Du har gått igenom {completed.length} sajt{completed.length === 1 ? "" : "er"}
    </h1>

    <ul class="mt-6 grid gap-2">
      {#each chosen as site}
        <li class="flex items-center gap-3 text-sm">
          <span
            aria-hidden="true"
            class="h-2 w-2 flex-none rounded-full {completed.includes(site.id)
              ? 'bg-blue-deep'
              : 'bg-faded'}"
          ></span>
          <span>{site.name}</span>
          <span class="ml-auto text-stem"
            >{completed.includes(site.id) ? "Genomförd" : "Hoppades över"}</span
          >
        </li>
      {/each}
    </ul>

    <div class="mt-8 border-t border-[var(--color-line)] pt-6">
      <h2 class="font-serif text-xl">Men det är inte gjort en gång för alla</h2>
      <p class="mt-3 text-stem">
        Sajterna raderar dig inte — de döljer dig. Uppgifterna ligger kvar hos dem, och de
        hämtar nya uttag ur offentliga register med jämna mellanrum. Du kan alltså dyka upp
        igen utan att någon gjort något fel. Sök på ditt namn ett par gånger om året, och
        hittar du dig själv är det bara att göra om det.
      </p>
    </div>

    <button
      type="button"
      onclick={restart}
      class="mt-7 rounded-full bg-blue-deep px-6 py-3 font-medium text-ring transition hover:bg-blue-hover"
    >
      Börja om
    </button>
  </section>
{/if}

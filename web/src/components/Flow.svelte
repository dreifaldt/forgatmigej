<script lang="ts">
  import RemovalLauncher from "./RemovalLauncher.svelte";
  import { needsIdentity, type Identity, type Site } from "../lib/sites";

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
  let stage = $state<"pick" | "identity" | "run" | "done">("pick");
  let index = $state(0);
  let completed = $state<string[]>([]);

  /**
   * Skrivs en gång, används överallt. Flyktig: lever i minnet, försvinner med
   * fliken, når aldrig en server. Utan den fick användaren skriva sitt namn på
   * nytt för varje mejlsajt, eftersom launchern monteras om per sajt.
   */
  let identity = $state<Identity>({ name: "", place: "" });

  const chosen = $derived(sites.filter((s) => picked.includes(s.id)));
  const current = $derived(chosen[index]);

  // Frågar bara när någon vald sajt faktiskt behöver veta vem hon är. Väljer hon
  // bara Ratsit hoppas steget över helt — BankID identifierar henne där, och då
  // har vi inget ärende till hennes namn.
  const identityNeeded = $derived(chosen.some(needsIdentity));
  const identityReady = $derived(identity.name.trim().length > 1);

  function toggle(id: string) {
    picked = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
  }

  function start() {
    index = 0;
    completed = [];
    stage = identityNeeded && !identityReady ? "identity" : "run";
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
{:else if stage === "identity"}
  <section class="mx-auto w-full max-w-[520px] px-5 py-14">
    <p class="text-xs tracking-[0.16em] text-stem uppercase">Innan vi börjar</p>
    <h1 class="mt-2 font-serif text-[clamp(24px,4vw,32px)] leading-tight font-light">
      Vem ska tas bort?
    </h1>
    <p class="mt-3 text-stem">
      Vi frågar en gång och återanvänder det för alla sajter du valt — du ska inte behöva
      skriva samma sak sju gånger.
    </p>

    <div class="mt-8 grid gap-5">
      <label class="grid gap-1.5">
        <span class="text-sm font-medium">Ditt namn</span>
        <span class="text-[13px] text-stem">
          Används för att söka upp dig hos tjänsterna och för att skriva dina mejl.
        </span>
        <input
          bind:value={identity.name}
          type="text"
          autocomplete="name"
          placeholder="För- och efternamn"
          class="rounded-xl border border-[var(--color-line)] bg-ring px-4 py-2.5 text-[15px]"
        />
      </label>

      <label class="grid gap-1.5">
        <span class="text-sm font-medium">Ort <span class="text-stem">(frivillig)</span></span>
        <span class="text-[13px] text-stem">
          Bara för att skilja dig från andra med samma namn i ett sökresultat. Vi frågar
          aldrig efter gatuadress eller personnummer.
        </span>
        <input
          bind:value={identity.place}
          type="text"
          autocomplete="address-level2"
          placeholder="Till exempel Göteborg"
          class="rounded-xl border border-[var(--color-line)] bg-ring px-4 py-2.5 text-[15px]"
        />
      </label>
    </div>

    <div class="mt-7 flex flex-wrap items-center gap-4">
      <button
        type="button"
        onclick={() => (stage = "run")}
        disabled={!identityReady}
        class="rounded-full bg-blue-deep px-6 py-3 font-medium text-ring transition hover:bg-blue-hover disabled:opacity-40"
      >
        Fortsätt
      </button>
      <button
        type="button"
        onclick={() => (stage = "pick")}
        class="text-sm text-stem underline underline-offset-4 hover:text-ink"
      >
        Tillbaka
      </button>
    </div>

    <p class="mt-6 text-[12.5px] leading-relaxed text-stem">
      Det du skriver stannar i den här fliken. Vi har ingen server att skicka det till, och
      när du stänger fliken är det borta.
    </p>
  </section>
{:else if stage === "run" && current}
  <!-- #key monterar om launchern för varje sajt. Utan den lever `opened` och
       `blocked` kvar från föregående sajt, och nästa i kön öppnar med ett
       felmeddelande om ett fönster användaren aldrig försökt öppna. -->
  {#key current.id}
    <RemovalLauncher
      site={current}
      queue={chosen}
      {index}
      {completed}
      {identity}
      onback={restart}
      ondone={next}
    />
  {/key}
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

    <!-- Hitta.se säger det själva, och de säger uttryckligen "och andra liknande
         tjänster". Det är enda åtgärden på den här sidan som angriper orsaken i
         stället för symptomet — därför står den för sig, inte i en punktlista. -->
    <div class="mt-6 rounded-2xl bg-surface p-5">
      <h3 class="font-serif text-lg">Gör det här också, annars kommer de tillbaka</h3>
      <p class="mt-2 text-[15px] text-stem">
        Be din teleoperatör dölja ditt nummer i nummerupplysningen. Så länge det ligger
        öppet där hämtar sajterna hem det igen — Hitta.se skriver rakt ut att uppgifterna
        annars ”riskerar att återpubliceras på hitta.se och andra liknande tjänster”. Det är
        ett samtal till din operatör, och det är den enda åtgärden här som tar bort orsaken
        i stället för symptomet.
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

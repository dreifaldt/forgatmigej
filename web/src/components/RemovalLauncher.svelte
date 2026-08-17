<script lang="ts">
  import Mark from "./Mark.svelte";
  import Stepper from "./Stepper.svelte";
  import type { Site } from "../lib/sites";

  /**
   * Startskärmen för en borttagning.
   *
   * VARFÖR ETT EGET FÖNSTER OCH INTE EN INBÄDDNING
   * Ratsit skickar `x-frame-options: SAMEORIGIN`. Sidan går alltså inte att rendera
   * inuti vår — webbläsaren vägrar. Det är tur, för en inbäddad inloggning hade sett
   * ut precis som ett nätfiske: vår logotyp runt någon annans BankID-ruta.
   *
   * Ett riktigt fönster ger användaren adressfältet tillbaka. Att hon ser
   * https://www.ratsit.se med hänglås är det enda som skiljer den äkta sidan från
   * en falsk, och det är just det en inbäddning tar ifrån henne. Därför står det
   * också i klartext i kortet vad hon ska titta efter.
   */
  let {
    site,
    queue,
    index,
    completed,
    onback,
    ondone,
  }: {
    site: Site;
    /** Hela kön, så att stegvisaren kan visa vad som är gjort och vad som står på tur. */
    queue: readonly Site[];
    index: number;
    completed: readonly string[];
    onback: () => void;
    ondone: () => void;
  } = $props();

  let opened = $state(false);
  let blocked = $state(false);

  /** Vad användaren ska se i adressfältet. Härlett, aldrig hårdkodat per sajt. */
  const origin = $derived(new URL(site.url).origin);

  /**
   * Igång = fönstret öppnades ELLER blockerades. Blockeras det tar användaren
   * länken i stället, och då måste hon fortfarande kunna säga att hon är klar.
   * Utan `|| blocked` blir den vägen en återvändsgränd.
   */
  const started = $derived(opened || blocked);

  function open() {
    blocked = false;
    const w = Math.min(1180, Math.max(900, Math.round(window.screen.availWidth * 0.62)));
    const h = Math.min(1000, Math.max(700, Math.round(window.screen.availHeight * 0.88)));
    // Centrerat över den skärm användaren faktiskt sitter vid.
    const left = window.screenX + Math.max(0, Math.round((window.outerWidth - w) / 2));
    const top = window.screenY + Math.max(0, Math.round((window.outerHeight - h) / 2));

    // INGEN `noopener` i feature-strängen. Sätts den returnerar window.open alltid
    // null enligt spec, och då hade vi trott att fönstret blockerades varenda gång.
    // Vi behöver handtaget för att skilja "stoppad av webbläsaren" från "öppnad".
    const handle = window.open(
      site.url,
      `fmn-${site.id}`,
      `popup=yes,width=${w},height=${h},left=${left},top=${top}`,
    );

    // Blockerad popup ger null. Då säger vi det i stället för att låtsas att
    // något hände — länken under fungerar ändå.
    if (!handle) {
      blocked = true;
      return;
    }
    opened = true;
    handle.focus?.();
  }
</script>

<div class="mx-auto flex w-full max-w-[520px] flex-col items-center px-5 py-10">
  <!-- Märket, stort. Samma roll som logotypen har högst upp i en inloggningsruta:
       säga vems gränssnitt du står i, innan du gör något. -->
  <div
    class="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-blue-pale"
    aria-hidden="true"
  >
    <Mark size={54} />
  </div>
  <p class="mt-4 font-serif text-xl">Förgätmigej</p>

  <div class="mt-8 w-full">
    <Stepper {queue} {index} {completed} />
  </div>

  <section
    class="mt-6 w-full rounded-3xl border border-[var(--color-line)] bg-surface p-8 shadow-[0_1px_2px_rgba(28,36,32,0.04)]"
  >
    <p class="text-xs tracking-[0.16em] text-stem uppercase">Du tas bort från</p>
    <h1 class="mt-1 font-serif text-3xl font-light">{site.name}</h1>

    <p class="mt-4 text-stem">
      {site.name} kräver att du själv säger ifrån{site.bankId
        ? " och legitimerar dig med BankID"
        : ""}. Vi öppnar deras sida i ett eget fönster och står kvar här med
      instruktionerna medan du gör det.
    </p>

    {#if site.steps.length > 0}
      <ol class="mt-6 grid gap-3">
        {#each site.steps as step, i}
          <li class="flex gap-3 text-[15.5px]">
            <span
              class="mt-[3px] flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-ground font-serif text-[13px] text-blue-deep"
              aria-hidden="true">{i + 1}</span
            >
            <span>{step}</span>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="mt-5 rounded-2xl bg-ground p-4 text-sm text-stem">
        Vi har inte läst av {site.name}s sida i detalj ännu, så vi vågar inte säga exakt
        var knapparna sitter. Följ deras egna instruktioner på sidan.
      </p>
    {/if}

    {#if site.source}
      <!-- Datumet är hela poängen: rutinerna ändras utan förvarning, och en
           instruktion utan ålder går inte att bedöma. -->
      <p class="mt-4 text-[12.5px] leading-relaxed text-stem">{site.source}</p>
    {/if}

    {#if !started}
      <button
        type="button"
        onclick={open}
        class="mt-7 w-full rounded-full bg-blue-deep px-6 py-3.5 font-medium text-ring transition hover:bg-blue-hover"
      >
        Öppna {site.name} i eget fönster
      </button>
    {:else}
      {#if opened}
        <div class="mt-7 rounded-2xl bg-ground p-4" aria-live="polite">
          <p class="text-sm font-medium">Fönstret är öppet</p>
          <p class="mt-1 text-sm text-stem">
            Gör stegen ovan i {site.name}s fönster och kom tillbaka hit när du är klar.
          </p>
        </div>
      {:else}
        <div class="mt-7 rounded-2xl bg-ground p-4" aria-live="assertive">
          <p class="text-sm font-medium">Webbläsaren stoppade fönstret</p>
          <p class="mt-1 text-sm text-stem">
            Tillåt popup-fönster för den här sidan, eller
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-deep underline underline-offset-2"
              >öppna {site.name} i en ny flik</a
            >. Kom tillbaka hit när du är klar.
          </p>
        </div>
      {/if}

      <div class="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onclick={ondone}
          class="flex-1 rounded-full bg-blue-deep px-5 py-3 font-medium text-ring transition hover:bg-blue-hover"
        >
          Jag är klar
        </button>
        <button
          type="button"
          onclick={open}
          class="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm transition hover:bg-ground"
        >
          Försök igen
        </button>
      </div>
    {/if}

    <!-- Det här stycket är inte dekoration. En användare som lärt sig legitimera sig
         i vilken ruta som helst är en användare som går på nästa bedrägeri. -->
    <p class="mt-6 border-t border-[var(--color-line)] pt-5 text-[13.5px] leading-relaxed text-stem">
      Kontrollera att adressfältet i det nya fönstret börjar med
      <strong class="font-medium text-ink">{origin}</strong> innan du
      {site.bankId ? "legitimerar dig" : "fyller i något"}. Vi kan inte visa
      {site.name}s sida inuti vår egen, och det är med flit — du ska kunna se vems sida du
      står på. Vi ser aldrig ditt personnummer och sparar det aldrig.
    </p>
  </section>

  <button
    type="button"
    onclick={onback}
    class="mt-6 text-sm text-stem underline underline-offset-4 hover:text-ink"
  >
    Avbryt
  </button>
</div>

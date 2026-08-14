import { allProviders } from "@/core/registry";
import { ProviderPicker } from "@/components/ProviderPicker";

export default function Home() {
  const providers = allProviders().map((p) => ({
    id: p.id,
    name: p.name,
    summary: p.summary,
    authenticationMethod: p.authenticationMethod,
    validForDays: p.validForDays,
    /**
     * Hur många uppgifter tjänsten begär *innan* flödet startar. Visas för att göra
     * poängen synlig direkt: Ratsit står på noll.
     */
    upfrontFieldCount: p.getRequiredInformation({
      providerId: p.id,
      status: "NOT_STARTED",
      collected: {},
      providerState: {},
      attempt: 0,
    }).length,
  }));

  return (
    <main className="pb-24">
      <header className="flex items-center justify-between pt-6">
        <span className="font-serif text-xl font-medium">Förgätmigej</span>
        <span className="text-xs uppercase tracking-[0.14em] text-stem">
          Frågar så lite som möjligt
        </span>
      </header>

      <section className="max-w-[680px] pt-16">
        <p className="mb-6 text-xs uppercase tracking-[0.16em] text-stem">Steg 1 av 2</p>
        <h1 className="font-serif text-[clamp(33px,6.2vw,56px)] leading-[1.08] font-light tracking-[-0.015em]">
          Var vill du <span className="italic text-blue-deep">försvinna?</span>
        </h1>
        <p className="mt-7 max-w-[46ch] text-stem">
          Välj tjänsterna du vill bort från. Vi frågar inte efter en enda personuppgift förrän en
          vald tjänst faktiskt kräver den — och när den gör det får du veta varför.
        </p>
      </section>

      <ProviderPicker providers={providers} />
    </main>
  );
}

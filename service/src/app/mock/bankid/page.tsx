import { MockBankId } from "./MockBankId";

/**
 * Övningssajt. Härmar formen på en personsöktjänsts borttagningsflöde: en knapp som
 * startar identifieringen, en kod som byts varje sekund, och därefter ett formulär som
 * ska kryssas i och bekräftas — det sista är det den dolda webbläsaren ska klara själv.
 *
 * Finns för att hela kedjan ska gå att köra och verifiera. Alternativet hade varit att
 * starta skarpa BankID-ordrar mot tjänsternas konton för att kartlägga deras DOM, vilket
 * vi inte gör. Sidan har ingenting med riktig BankID att göra och genererar ingen giltig kod.
 */
export const dynamic = "force-dynamic";

export default async function MockPage({
  searchParams,
}: {
  searchParams: Promise<{ signAfter?: string; provider?: string }>;
}) {
  const { signAfter, provider } = await searchParams;
  const delay = Number(signAfter ?? "6000");

  return (
    <main className="py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-stem">Övningssajt — inte riktig BankID</p>
      <h1 className="mt-4 font-serif text-3xl font-light">
        Ta bort dig från {provider ?? "tjänsten"}
      </h1>
      <p className="mt-3 max-w-[52ch] text-stem">
        Legitimera dig nedan för att ta bort dina uppgifter.
      </p>
      <MockBankId signAfterMs={Number.isFinite(delay) ? delay : 6000} />
    </main>
  );
}

/**
 * Sajterna vi begär borttagning från.
 *
 * Enda stället som behöver röras när en sajts rutin eller adress ändras.
 * Birthday.se är borttagen (2026-08-14) — återinför den inte utan att fråga.
 *
 * `steps` är det användaren faktiskt ska göra på sajtens egen sida, i ordning.
 * De är formulerade för att läsas bredvid det öppna fönstret, inte i efterhand.
 * Är de tomma vet vi inte tillräckligt om sajten ännu — säg det i så fall rakt ut
 * i gränssnittet i stället för att hitta på steg.
 */
export interface Site {
  readonly id: string;
  readonly name: string;
  /** Adressen borttagningen faktiskt börjar på — inte sajtens startsida. */
  readonly url: string;
  /** Vad borttagningen åstadkommer. Visas i urvalet. */
  readonly does: string;
  /** Något användaren bör veta innan hon börjar. */
  readonly note: string;
  /** Kräver sajten BankID? Styr vad vi säger om legitimering. */
  readonly bankId: boolean;
  readonly steps: readonly string[];
  /** Har någon läst av sajtens faktiska sida? Styr hur säkert vi formulerar oss. */
  readonly verified: boolean;
  /**
   * Var stegen är lästa, och när. Obligatoriskt så fort `verified` är sant.
   *
   * Finns för att nästa person ska kunna se skillnad på "avläst mot skarp sida"
   * och "någon mindes hur det brukade se ut". Rutinerna ändras utan förvarning,
   * och ett datum är det enda som avslöjar när en instruktion har surnat.
   */
  readonly source?: string;
}

export const SITES: readonly Site[] = [
  {
    id: "ratsit",
    name: "Ratsit",
    url: "https://www.ratsit.se/tabort",
    does: "Hela den publika profilen döljs och försvinner ur Googles resultat.",
    note: "Du raderas inte ur deras interna register — inloggade kan fortfarande nå uppgifterna.",
    bankId: true,
    // Avläst 2026-08-17 från sidans markup: kryssrutan sitter i en label med
    // klassen ratsit-checkbox, och BankID-knappen är disabled tills den är i.
    steps: [
      "Kryssa i rutan om att du vill dölja dina uppgifter.",
      "Klicka på ”Ta bort dig från Ratsit” — knappen tänds först när rutan är i.",
      "Legitimera dig med BankID i din egen app.",
    ],
    verified: true,
    source: "Avläst ur sidans markup 2026-08-17 (label.ratsit-checkbox, knappen disabled tills den är i).",
  },
  {
    id: "hitta",
    name: "Hitta.se",
    // Deras egen integritetssida. Det är där rutinen står — startsidan säger inget.
    url: "https://www.hitta.se/din-integritet",
    does: "Uppgifterna döljs ur söket, men först efter att de gått med på det.",
    note: "De nekar radering och hänvisar till utgivningsbeviset. Be om att döljas, inte raderas.",
    // Ingen BankID-legitimering är dokumenterad i deras policy — rutinen är att
    // kontakta dem. Att policyn inte nämner BankID bevisar dock inte att det
    // saknas ett självbetjäningsformulär vi inte kommit åt. Därför false, inte
    // "verifierat frånvarande".
    bankId: false,
    steps: [
      "Gå till avsnitt 7, ”Dina rättigheter”, längst ner på deras integritetssida.",
      "Kontakta dem på vägen som anges där och begär att dina uppgifter döljs ur söktjänsten.",
      "Skriv ”dölj”, inte ”radera”. De svarar att GDPR inte gäller dem och att de inte är skyldiga att radera — men de döljer uppgifter efter överenskommelse.",
    ],
    verified: true,
    source:
      "Läst ur hitta.se/din-integritet 2026-08-17, avsnitt 7: ”Vi kan enligt överenskommelse med dig i stället dölja vissa av dina uppgifter från vår söktjänst.” Policyn daterad 2024-09-16.",
  },
  {
    id: "mrkoll",
    name: "MrKoll",
    url: "https://mrkoll.se",
    does: "Oftast döljs bara adress och telefonnummer — posten ligger kvar.",
    note: "Adressdöljningen är kortlivad och behöver göras om ofta.",
    bankId: false,
    steps: [],
    verified: false,
  },
  {
    id: "merinfo",
    name: "Merinfo",
    url: "https://www.merinfo.se",
    does: "Uppgifterna döljs inom några dagar.",
    note: "Giltighetstid inte offentligt angiven.",
    bankId: true,
    steps: [],
    verified: false,
  },
  {
    id: "eniro",
    name: "Eniro",
    url: "https://www.eniro.se",
    does: "Begäran om borttagning görs via uppdateringssidan.",
    note: "Giltighetstid inte offentligt angiven.",
    bankId: true,
    steps: [],
    verified: false,
  },
  {
    id: "upplysning",
    name: "Upplysning.se",
    url: "https://www.upplysning.se",
    does: "Borttagning ur publika söket.",
    note: "Mejla med namn, adress och länken till din sida.",
    bankId: false,
    steps: [],
    verified: false,
  },
];

export const siteById = (id: string): Site | undefined => SITES.find((s) => s.id === id);

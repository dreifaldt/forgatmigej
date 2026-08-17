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
  },
  {
    id: "hitta",
    name: "Hitta.se",
    url: "https://www.hitta.se",
    does: "Uppgifterna döljs i sajtens sök.",
    note: "Raderas inte ur källregistret. Spärren måste förnyas.",
    bankId: true,
    steps: [],
    verified: false,
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

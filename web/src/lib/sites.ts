/**
 * Sajterna vi begär borttagning från.
 *
 * Enda stället som behöver röras när en sajts rutin eller adress ändras.
 *
 * VI FRÅGAR ALDRIG EFTER PERSONNUMMER.
 * Flera guider på nätet säger att man ska uppge det i sitt mejl. Vi gör inte det.
 * En länk till den egna profilen hos tjänsten pekar ut exakt samma post, är
 * betydligt mindre känslig, och användaren hittar den genom att söka på sig själv.
 * Kräver en tjänst BankID legitimerar hon sig direkt hos dem, mot deras egen kod.
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
  /**
   * Hur borttagningen faktiskt går till hos den här tjänsten.
   *
   * "window" — de har ett eget formulär. Vi öppnar deras sida och guidar.
   * "email"  — rutinen är att mejla. Vi skriver brevet, användaren skickar det
   *            från sin egen adress.
   *
   * Mejlet skickas aldrig av oss. Dels för att vi inte har någon server, dels
   * för att ett brev från oss i hennes namn både hamnar i skräpposten (SPF/DKIM)
   * och saknar det enda som gör det trovärdigt: att det kommer från henne.
   */
  readonly route: "window" | "email";
  /** Bara för route: "email". Mottagare och ärenderad. */
  readonly email?: { readonly to: string; readonly subject: string };
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
    route: "window",
    steps: [
      "Kryssa i rutan om att du vill dölja dina uppgifter.",
      "Klicka på ”Ta bort dig från Ratsit” — knappen tänds först när rutan är i.",
      "Legitimera dig med BankID i din egen app.",
    ],
    verified: true,
    source:
      "Avläst ur sidans markup 2026-08-17 (label.ratsit-checkbox, knappen disabled tills den är i).",
  },
  {
    id: "birthday",
    name: "Birthday.se",
    url: "https://www.birthday.se/personuppgifter",
    // Den enda av sajterna som lovar radering, inte bara döljning.
    does: "Uppgifterna raderas — både ur publika söket och deras interna system.",
    note: "De gör en individuell bedömning. Svar kommer per mejl, inte direkt.",
    bankId: false,
    route: "email",
    email: {
      to: "info@birthday.se",
      subject: "Begäran om radering av mina personuppgifter",
    },
    steps: [
      "Sök upp dig själv på Birthday.se och kopiera adressen till din egen sida.",
      "Klistra in länken nedan — den pekar ut rätt post utan att du behöver uppge personnummer.",
      "Vi skriver mejlet. Du skickar det från din egen adress, så att de ser att det är du.",
    ],
    verified: true,
    source:
      "Läst ur birthday.se/personuppgifter 2026-08-17: ”Om du vill få dina uppgifter borttagna och raderade från Birthday.se, mejla […]. Vi tar då bort uppgifterna både från vårt publika sök och våra interna system.” Adressen på sidan är maskerad — info@birthday.se är hämtad ur deras egen JS-bundle och bör bekräftas med en blick.",
  },
  {
    id: "hitta",
    name: "Hitta.se",
    url: "https://www.hitta.se/din-integritet",
    does: "Uppgifterna döljs ur söket, men först efter att de gått med på det.",
    note: "De nekar radering och hänvisar till utgivningsbeviset. Be om att döljas, inte raderas.",
    bankId: false,
    route: "window",
    steps: [
      "Gå till avsnitt 7, ”Dina rättigheter”, längst ner på deras integritetssida.",
      "Kontakta dem på vägen som anges där och begär att dina uppgifter döljs ur söktjänsten.",
      "Skriv ”dölj”, inte ”radera”. De svarar att GDPR inte gäller dem och att de inte är skyldiga att radera — men de döljer uppgifter efter överenskommelse.",
    ],
    verified: true,
    source:
      "Läst ur hitta.se/din-integritet 2026-08-17, avsnitt 7. Obs: det ryktas om en egen ”ta bort”-sida med BankID, men den gick inte att hitta — åtta gissade adresser gav 404 och deras policy nämner den inte. Hittar du den är den troligen snabbare än kontaktvägen ovan.",
  },
  {
    id: "mrkoll",
    name: "MrKoll",
    // Adressen är angiven av Erik 2026-08-17. Sidans innehåll går inte att läsa:
    // MrKoll svarar med en hård Cloudflare-blockering, inte ens en challenge.
    // Därför rätt sida men inga steg — vi öppnar den och låter deras egen text
    // tala. Att gissa vad som står där vore att hitta på.
    url: "https://mrkoll.se/om/andra-uppgifter/",
    does: "Oftast döljs bara adress och telefonnummer — posten ligger kvar.",
    note: "Adressdöljningen är kortlivad och behöver göras om ofta.",
    bankId: false,
    route: "window",
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
    route: "window",
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
    route: "window",
    steps: [],
    verified: false,
  },
  {
    id: "upplysning",
    name: "Upplysning.se",
    url: "https://www.upplysning.se",
    does: "Borttagning ur publika söket.",
    note: "Rutinen ska vara mejl med namn och länk till din sida.",
    bankId: false,
    route: "window",
    steps: [],
    verified: false,
  },
];

export const siteById = (id: string): Site | undefined => SITES.find((s) => s.id === id);

/**
 * Brevet användaren skickar.
 *
 * Ingen juridisk argumentation och inga paragrafhänvisningar. Sajterna har
 * utgivningsbevis och avfärdar GDPR-krav rutinmässigt — ett brev som öppnar med
 * fel lagrum får ett nej som svar. Det som fungerar är en tydlig begäran med en
 * länk som pekar ut rätt post.
 *
 * Personnummer förekommer inte, och ska inte läggas till.
 */
export function buildRemovalEmail(site: Site, name: string, profileUrl: string): string {
  const lines = [
    "Hej,",
    "",
    `jag begär att mina personuppgifter tas bort från ${site.name}.`,
    "",
    `Namn: ${name || "[ditt namn]"}`,
    `Min sida hos er: ${profileUrl || "[länk till din profil hos dem]"}`,
    "",
    "Jag har utelämnat mitt personnummer med flit. Länken ovan pekar ut rätt post.",
    "Behöver ni något mer för att identifiera uppgifterna, hör av er så kompletterar jag.",
    "",
    "Vänliga hälsningar",
    name || "[ditt namn]",
  ];
  return lines.join("\n");
}

/** mailto:-adress med ärende och färdig text. Öppnas i användarens egen e-postklient. */
export function mailtoHref(site: Site, name: string, profileUrl: string): string {
  if (!site.email) return "";
  const body = buildRemovalEmail(site, name, profileUrl);
  return `mailto:${site.email.to}?subject=${encodeURIComponent(site.email.subject)}&body=${encodeURIComponent(body)}`;
}

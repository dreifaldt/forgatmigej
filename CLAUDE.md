# Förgätmigej

**Produkten är borttagning, inte bevakning** (scopet rättat 2026-08-17). MVP är: välj sajter → ta
bort användarens uppgifter från dem en gång → visa en kvittens. Att bevaka om användaren dyker upp
igen — scanning plus bevakning — är en **senare feature, uttryckligen inte MVP**.

Det spelar roll för att roten fram till 2026-08-17 var byggd som motsatsen: en nedräkning mot att
spärrar löper ut, med copy som lovade att sajten *inte* skickar någon begäran åt användaren. Den
copyn var live och motsade produkten. Skriv inte tillbaka den.

Repot är **två saker** sedan 2026-08-14. Blanda inte ihop dem:

| | Roten | `service/` |
|---|---|---|
| Vad | Statisk landningssida + urval av sajter. Steg 1 i MVP | Next.js-app som genomför borttagningarna. Steg 2 och 3 |
| Byggsteg | Inget. Inga beroenden, ingen paketfil | `npm install`, `npx playwright install chromium`, 17 tester |
| Samlar in | **Ingenting** | Bara det en vald tjänst faktiskt kräver, när den kräver det. Fyra av sex tjänster: noll fält |
| Publiceras | GitHub Pages | **Inte ännu — blockerat på att selektorerna verifieras** |

De två halvorna hänger inte ihop i kod ännu: roten slutar i en sammanställning som säger rakt ut
att automatiken inte är öppen, och länkar vidare till varje sajt. Det är avsiktligt — inget
automatiserat klick skickas ut mot gissade selektorer.

Roten är oförändrad och ska förbli det. **Lägg inte till ett byggsteg i roten** — frånvaron av det
är ett designbeslut, och `service/` finns just för att slippa det.

**Kör roten:** öppna `index.html`, eller `python3 -m http.server 8000` för rena adresser.
**Kör tjänsten:** `cd service && npm install && npm run dev`.
**Publicera:** `git push origin main` → `.github/workflows/deploy-pages.yml` bygger och publicerar
till GitHub Pages (triggas bara av ändringar i rotens filer, inte `service/`). Kräver att
Settings → Pages → Source står på **GitHub Actions**, inte "Deploy from a branch". Domän
`forgatmigej.dreifaldt.com`.

## Filer i roten

| Fil | Roll |
|---|---|
| `index.html` | Hela sajten i en fil: landningssida, urval, sammanställning. All CSS i ett `<style>`, all JS. Sajtdatan ligger i `SITES`. |
| `brand.html` | Fristående färgplansch: botanisk SVG, swatchar, regellista. Dokumentation — inte produkt. |
| `404.html` | Rotabsoluta sökvägar (Pages serverar den för godtyckliga paths). Följden: ostilad tills egen domän är på plats. |
| `assets/tokens.css` | Enda delade CSS-filen. Palettens definition. |
| `assets/favicon.svg` | Märket. Fristående fil som inte kan nå CSS-variabler — hex hör hemma där. |
| `CNAME`, `.nojekyll` | Pages-rörmokeri. `.nojekyll` behövs, annars filtrerar Jekyll bort filer som börjar med `_`. |

`index.html` och `brand.html` använder relativa asset-sökvägar och fungerar både på projektadressen
och på egen domän. `404.html` gör inte det, avsiktligt.

## Paletten är bindande

Källa: *Myosotis sylvatica*. Varje token svarar mot en faktisk del av blomman — behåll den
kopplingen om du lägger till något. Reglerna står i klartext längst ner i `tokens.css`:

1. **Färgvärden definieras bara i `assets/tokens.css`.** Ingen ny hex eller rgb i HTML-filerna.
2. `--fmn-eye` (gult öga) och `--fmn-bud` (rosa knopp) är **aldrig textfärger**. De är prickar och
   markörer, små ytor.
3. **`--fmn-bud` markerar exakt ett tillstånd i produkten: utgången spärr.** Ingenting annat får
   vara rosa. Märket är undantaget — ögat sitter alltid i logotypen.
4. Gult möter blått bara med `--fmn-ring` (den vita kragen) emellan.
5. `--fmn-blue-deep` är den enda blå som får bära text.
6. Bottenfärgen är aldrig ren vit. Ljuset ska komma från blomman, inte från pappret.

### Var den rosa knoppen faktiskt sitter

**Ingenstans, sedan 2026-08-17.** Rosa markerade utgången spärr, och nedräkningen som ägde det
tillståndet togs bort när scopet rättades till borttagning. Ingen sida i repot använder
`--fmn-bud` längre — varken roten eller `service/`.

Aliaset `--bud` står kvar definierat i `index.html` med en kommentar om varför det är oanvänt.
Det är avsiktligt, samma val som `service/` gjort: färgen har en betydelse reserverad, inte ledig.
**Ta inte det som en inbjudan att ge den en ny uppgift.** Kommer bevakningen tillbaka är det
utgången spärr den ska märka ut, ingenting annat.

## Hur tokens faktiskt används

`tokens.css` har två lager: råtokens `--fmn-*` och rolltokens `--color-*`. **Rollagret används inte
av någon sida** (0 träffar på `var(--color-` i `index.html`). Sidorna aliasar i stället `--fmn-*`
till egna korta namn i sin egen `:root`:

```css
--lichen:var(--fmn-ground);   --card:var(--fmn-surface);      --ink:var(--fmn-ink);
--stem:var(--fmn-stem);       --blue:var(--fmn-blue);         --blue-deep:var(--fmn-blue-deep);
--blue-pale:var(--fmn-blue-pale); --eye:var(--fmn-eye);       --ring:var(--fmn-ring);
--bud:var(--fmn-bud);         --leaf:var(--fmn-leaf);         --drift:var(--fmn-faded);
```

Följ det mönstret i befintliga filer. Anta inte att `--color-*` är API:et bara för att `tokens.css`
ser ut så — det är död kod tills någon river det eller tar det i bruk på riktigt.

## Kända avvikelser från regel 1

Finns redan i repot. Städa gärna, men vet att de är där innan du "upptäcker" dem igen:

(Radnummer i `index.html` gäller efter omskrivningen 2026-08-17. Antalet avvikelser är oförändrat
— inga nya tillkom.)

- `#33508B` (hover-blå) hårdkodad i `index.html:60` och `404.html:25`, trots att värdet redan finns
  som `--color-action-hover` i `tokens.css`. Två kopior som kan glida isär.
- `rgba(28,36,32,.12)` upprepad som `--edge` i `index.html:32` och `--line` i `brand.html:15`, trots
  att `--fmn-line` är exakt samma värde.
- Tonade varianter i `index.html:64,88,101` — `rgba(110,147,214,.11)`, `rgba(110,147,214,.16)`,
  `rgba(28,36,32,.28)`, `#fff`. Paletten har inga tint-tokens; det är hålet de fyller.
- `brand.html` använder literal hex i planschens SVG och i swatcharna. Det är avsiktligt — sidan
  demonstrerar värdena. Men `brand.html:51` drar in `#7A4A66`, som inte finns i paletten alls.

## Kontrastsiffrorna i tokens.css är overifierade

Tabellen säger sig vara mätt mot `--fmn-ground`, men bara `--fmn-stem` stämmer mot den basen.
Övriga rader ligger närmare en mätning mot vitt eller `--fmn-surface`. Omräknat mot `--fmn-ground`
(#EDF0EA):

| token | i filen | faktiskt |
|---|---|---|
| `--fmn-ink` | 16,1:1 | 13,8:1 |
| `--fmn-stem` | 5,6:1 | 5,6:1 |
| `--fmn-blue-deep` | 6,2:1 | 5,4:1 |
| `--fmn-leaf` | 2,4:1 | 2,6:1 |
| `--fmn-blue` | 2,9:1 | 2,7:1 |
| `--fmn-eye` | 1,7:1 | 1,5:1 |
| `--fmn-bud` | 2,2:1 | 2,1:1 |

Slutsatserna håller ändå: ink, stem och blue-deep klarar WCAG AA för brödtext (≥4,5:1), resten
ligger under 3:1 och duger bara till dekor. Men citera inte siffrorna som de står — räkna om innan
de visas för någon.

## Innehåll och löften

- Allt användarvänt är på svenska. Håll tonen: kort, konkret, utan juridikprosa.
- **Produkten skickar begäranden åt användaren.** Det är hela poängen. Rotens gamla copy sa
  motsatsen ("Förgätmigej gör ingen begäran åt dig — du gör spärren själv") och är borttagen. Skriv
  inte tillbaka den formuleringen i någon variant.
- **Vi frågar aldrig efter personnummer.** Kräver sajten BankID legitimerar användaren sig direkt
  hos dem, mot deras egen kod. Löftet är inte "vi frågar aldrig om något" utan "vi frågar bara om
  det som krävs, när det krävs, och säger varför". Håll den formuleringen rak — de är inte samma
  löfte, och det svagare är det sanna.
- **Att döljas är inte att raderas, och det håller inte för alltid.** Sajterna behåller uppgifterna
  och hämtar nya uttag ur offentliga register. Slutskärmen ska säga det rakt ut och göra det lätt
  att begära om — inte "Klart!" och punkt. Se `DonePanel.tsx`, som redan gör det.
- Ingen juridisk rådgivning. Rättsläget rör sig — IMY hävdar tillsynsrätt även över tjänster med
  frivilligt utgivningsbevis — så skriv inget tvärsäkert om GDPR.
- `SITES` bär `days:` per tjänst (Ratsit 365, Hitta 1095, MrKoll 30, övriga `null`). **Fältet
  används inte av MVP** — det hör till bevakningen och ligger kvar som researchad data. Siffrorna
  är hämtade publikt och delvis overifierade. Flagga hellre än gissa. `FALLBACK_DAYS` är borta
  tillsammans med nedräkningen.
- `SITES` i `index.html` är enda stället som behöver röras när en sajts metod eller URL ändras.
  **Sex sajter, samma lista som `service/src/core/registry.ts`.** Birthday.se är borttagen ur båda
  — håll dem i takt.

## `service/` — progressiv uppgiftsinsamling

Hela poängen med tjänsten är *när* den frågar, inte vad den kan. Fyra invarianter bär den, och de
sitter i typerna och motorn snarare än i dokumentationen. Bryts någon av dem är det inte en
stilfråga utan en trasig produkt:

1. **`reason` är obligatoriskt på `FieldDefinition`** (`src/core/fields.ts`). Det går inte att
   definiera ett fält utan att motivera det. Därför kan UI:t alltid visa ett skäl — det kan inte
   saknas. `field()` kastar på tom motivering.
2. **`getRequiredInformation(context)` anropas om före *varje* steg**, inte en gång i början
   (`src/core/engine.ts`, `runUntilBlocked`). Svaret får ändras. Det är så ett fält kan dyka upp
   mitt i flödet i stället för i ett formulär i förväg.
3. **`scopeContextToProvider()` projicerar bort allt providern inte deklarerat.** En tjänst kan
   inte läsa en uppgift den inte bett om, även om användaren lämnat den till en annan tjänst i
   samma körning.
4. **`Vault.set()` kastar för en uppgift som ingen efterfrågat** (`src/core/vault.ts`). "Samla in
   för säkerhets skull" är ett programmeringsfel, inte ett policybrott ingen upptäcker.

Testerna i `src/core/*.test.ts` vaktar exakt de här fyra. Går de sönder, laga beteendet — skriv
inte om testet.

### Providers

Ny tjänst = en fil i `src/providers/` plus en rad i `src/core/registry.ts`. Inget annat ändras.
BankID-tjänster skrivs som anrop till `bankIdProvider()` med en `BankIdFlowConfig`.

Sex tjänster: Ratsit, MrKoll, Hitta.se, Merinfo, Eniro, Upplysning.se. **Birthday.se är borttagen**
(begärt 2026-08-14) — återinför den inte utan att fråga.

- **Ratsit, Hitta, Merinfo, Eniro** begär **noll fält**. BankID identifierar användaren direkt hos
  tjänsten, alltså frågar vi inte om något alls. De tomma listorna är en produktegenskap, inte en
  TODO — fyll inte på dem. Personnumret passerar aldrig systemet.
- **MrKoll** (`mrkoll.ts`) är **overifierad** — sajten svarar 403 på hämtning. Returnerar `manual`
  med instruktioner. Så ska en overifierad tjänst bete sig.
- **Upplysning.se** (`upplysning.ts`) är den enda kvar som visar ett fält som dyker upp mitt i
  flödet: namn och e-post räcker, men blir uppslaget tvetydigt begärs en profillänk. Adress
  efterfrågas aldrig — länken pekar ut samma post och är mindre känslig. `lookupProfiles()` är en
  platshållare som returnerar 2 för namn med "Andersson", så grenen går att köra utan att träffa
  sajten.

### Två regler för nya providers

1. Deklarera bara fält du kan motivera. Skälet visas ordagrant för användaren.
2. `verified: false` tills selektorerna är avlästa mot skarp sajt. `kind: "manual"` är ett fullgott
   svar. Hellre ett ärligt "gör det här själv" än ett formulär byggt på gissade fältnamn.

## Automationen — läs innan du rör den

`src/automation/` kör headless Chromium, hämtar tjänstens egen BankID-QR och strömmar den till
användaren över SSE medan den skannas.

**Kön är inte en detalj.** `queue.ts` kör tjänsterna **en i taget**: Ratsit klart först, sedan
startar Hitta.se. Två skäl, båda hårda. En människa kan bara skanna en kod åt gången, och ordern
avbryts efter trettio sekunder — startades alla parallellt hade resten hunnit gå ut. Och fem koder
på skärmen samtidigt är obegripligt. Parallellisera inte.

**`postAuthSteps`** i `BankIdFlowConfig` är det som återstår efter inloggningen: kryssa i,
bekräfta, skicka. Den dolda webbläsaren gör det åt användaren så att hon aldrig ser tjänstens
formulär. `fill` hämtar värdet ur valvet och hoppar hellre över än gissar när det saknas.

**Inget teknikprat i gränssnittet.** Inga metod-etiketter i listan, statusar på vanlig svenska.
Ett undantag är medvetet: modalen visar alltid tjänstens namn stort tillsammans med koden. En kod
utan avsändare är precis den form ett bedrägeri tar — förenkla inte bort den raden.

**Den signerar aldrig åt användaren.** Den läser, lagrar och vidarebefordrar ingen BankID-hemlighet
och innehåller ingen kod som kringgår identifieringen. Skriv inte in någon.

**Två tal är inte godtyckliga.** `QR_REFRESH_MS = 1000` och `QR_ORDER_TIMEOUT_MS = 30_000` kommer
från BankID: koden roteras varje sekund och ordern avbryts efter trettio utan skanning. Det är
designat just för att en stillbild inte ska gå att flytta till en annan skärm. Blir kedjan
långsammare slutar koden fungera av sig själv. Sänk inte takten för att spara CPU.

**Den obekväma delen:** att visa en BankID-kod i sitt eget gränssnitt har samma form som ett
BankID-bedrägeri. Här har användaren bett om det och modalen säger i klartext vilken tjänst koden
gäller — men mönstret tränar ändå in "skanna en kod någon annan visar". Står valet mellan
QR-vidareförmedling och `bankid://`-autostart på samma enhet är autostart det säkrare svaret.
Se README → "Läs det här innan QR-vidareförmedlingen går i produktion".

**Ingen tjänsts DOM är avläst.** Alla `BankIdFlowConfig` har `verified: false`. Att läsa av dem
hade krävt skarpa BankID-ordrar mot tjänsternas konton, vilket vi inte gör för att kartlägga en
sajt. Öppna sidan för hand, läs markup, fyll i selektorerna, sätt `verified: true`.

### Verifiera skrapningen utan att röra en skarp tjänst

`/mock/bankid` härmar formen på ett BankID-steg med en kod som byts varje sekund. Sätt
`FMN_MOCK_BANKID_URL` så körs **exakt samma flödeskod** mot den. Verifierat 2026-08-14: åtta unika
QR-bilder, en per sekund, signering upptäckt, `SUBMITTED` satt. Kör om den innan du tror på en
ändring i `bankIdFlow.ts` — den vägen är den enda som testar skrapningen på riktigt.

### Inte byggt ännu

Kö (webbläsaren körs i Next-processen — flytta till en worker bakom BullMQ innan riktig trafik),
verifierade selektorer, lagring som överlever omstart (`store.ts` är i minnet med två timmars TTL;
`RequestStore` är formen en Postgres-adapter ska ha), och utskick av e-postbegäran.

Verifierade selektorer är det som blockerar allt annat: tjänsten publiceras inte förrän de är
avlästa. Bevakningen finns inte någonstans längre och är inte MVP — se toppen av filen.

### Färg i tjänsten, och rankan

`service/src/app/globals.css` har ett `@theme`-block som är tjänstens motsvarighet till
`assets/tokens.css`: enda stället där färgvärden får definieras på den sidan av repot. Värdena är
desamma. Regel 3 gäller oförändrat — och eftersom tjänsten inte har någon nedräkning används
**rosa inte alls** där. Lägg den inte på `FAILED`; det vore en andra betydelse och regeln tillåter
bara en.

`VineBackground.tsx` är förgätmigejen som växer fram i bakgrunden. Den har **inga rosa knoppar**,
trots att en riktig *Myosotis* har det — regel 3 igen. Två fällor som redan är trampade i och inte
ska trampas om:

- Bottenfärgen sätts **bara på `html`**. Sätts den även på `body` målar body-bakgrunden över allt
  på negativ z-index och rankan försvinner, utan att något ser trasigt ut.
- `vine-sway` animerar **`rotate`, aldrig `transform`**. Tailwinds `-translate-x-1/2` sätter
  CSS-egenskapen `translate`; en `transform` läggs ovanpå i stället för att ersätta, och rankan
  hamnar en halv bredd åt vänster.

## Git

En gren, `main`, remote `origin` → `github.com/dreifaldt/forgatmigej`. Commits i historiken är
författade som "Förgätmigej". Meddelandena är svenska: kort rubrik (substantivfras eller imperativ),
sedan brödtext som förklarar *varför* beslutet togs, inte vad diffen gör. Följ den formen.

Den här filen är trackad sedan 2026-08-14 och följer med repot.

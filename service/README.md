# Förgätmigej — borttagningstjänsten

Next.js-appen som genomför borttagningarna — steg 2 och 3 i produkten. Ligger bredvid den statiska
sajten i repots rot, som är landningssida och urval (steg 1) och fortfarande saknar byggsteg.

```bash
npm install
npx playwright install chromium   # automationen behöver en webbläsare
npm run dev                       # http://localhost:3000
npm test                          # 17 tester
npm run typecheck
```

## Flödet

```
Välj tjänster ur listan
  ↓
De som behöver uppgifter frågar — med skäl, en fråga i taget
  ↓
"Sätt igång" → kön startar
  ↓
  ┌─ för varje tjänst, EN I TAGET ────────────────────┐
  │  dold webbläsare öppnar tjänstens sida            │
  │  hämtar deras kod → visas med tjänstens namn      │
  │  användaren legitimerar sig i sin egen app        │
  │  dold webbläsare kryssar i och bekräftar          │
  │  klart → nästa tjänst startar                     │
  └───────────────────────────────────────────────────┘
```

Kön är inte en detalj. En människa kan bara skanna en kod åt gången, och en order avbryts
efter trettio sekunder — startades alla samtidigt hade resten hunnit gå ut medan hon höll
på med den första. Dessutom: fem koder på skärmen och ingen som vet vilken som gäller vad.

### Inget teknikprat i gränssnittet

Användaren ska inte behöva veta vad BankID, ett formulär eller ett manuellt steg är. Listan
visar inga metod-etiketter, statusarna är på vanlig svenska ("Väntar på dig", "Behöver din
hjälp"), och modalen säger *vilken tjänst* koden gäller snarare än vilken teknik som används.

Ett undantag är medvetet: koden i modalen presenteras alltid tillsammans med tjänstens namn,
stort. En kod utan avsändare är precis den form ett bedrägeri tar. Den raden får inte
förenklas bort.

## Principen: fråga så lite som möjligt, exakt när det behövs

Fyra invarianter, i typerna och motorn snarare än i dokumentationen:

1. **`reason` är obligatoriskt på `FieldDefinition`.** Går det inte att motivera fältet ska det
   inte begäras. `field()` kastar på tom motivering.
2. **`getRequiredInformation(context)` anropas om före varje steg**, inte en gång i början.
   Svaret får ändras — så kan ett fält dyka upp mitt i flödet.
3. **`scopeContextToProvider()`** ger providern bara de fält den själv deklarerat.
4. **`Vault.set()` kastar** för en uppgift ingen har efterfrågat.

Med BankID-skrapningen på plats begär fyra av sex tjänster **noll uppgifter**. Det är principen
tagen till sin ände: tjänsten identifierar användaren själv, alltså frågar vi inte om något.

| Tjänst | Metod | Fält | Skarpa selektorer |
|---|---|---|---|
| Ratsit | BankID + automation | **0** | Sidan läst 2026-08-14, DOM **overifierad** |
| Hitta.se | BankID + automation | **0** | **Overifierad** |
| Merinfo | BankID + automation | **0** | **Overifierad** |
| Eniro | BankID + automation | **0** | **Overifierad** |
| MrKoll | Manuell | 3 | 403 mot hämtning |
| Upplysning.se | E-post | 3 (+1 vid tvetydigt namn) | **Overifierad** |

## Automationen

`src/automation/` kör en headless Chromium per körning. Headless betyder utan fönster — den
behöver ändå en viewport med storlek, för en QR-kod går inte att fotografera i en yta som är noll
gånger noll. "Osynlig" och "nolldimensionell" är inte samma sak.

`src/automation/qr.ts` letar QR-koden med flera strategier i tur och ordning (canvas, img med
data-URL, svg, testid) och filtrerar på att elementet är kvadratiskt och minst 80 px. Inga
hårdkodade klassnamn — sådana slutar fungera i tysthet nästa gång tjänsten rör sin frontend.
Hittas ingenting lämnar flödet över till användaren i stället för att gissa.

### Vad automationen aldrig gör

Den signerar inte åt användaren, läser inte och lagrar inte någon BankID-hemlighet, och innehåller
ingen kod som försöker gå runt identifieringen. QR-koden är tjänstens egen, ordern är tjänstens
egen, och det är användarens BankID i användarens telefon som slutför den.

### Läs det här innan QR-vidareförmedlingen går i produktion

BankID roterar koden **varje sekund** och avbryter ordern efter **30 sekunder** utan skanning.
Båda talen finns i koden (`QR_REFRESH_MS`, `QR_ORDER_TIMEOUT_MS`) och de är inte godtyckliga:
den animerade koden infördes just för att en stillbild inte ska gå att flytta till en annan skärm.

Två saker följer av det:

1. **Kedjan måste hålla takten.** Skrapa → fotografera → base64 → SSE → rendera, en gång per
   sekund. Blir det långsammare slutar koden fungera av sig själv. Det är designat så.
2. **Att visa en BankID-kod i sitt eget gränssnitt är formmässigt samma sak som ett
   BankID-bedrägeri ser ut.** Skillnaden är att användaren här har bett om det och får veta
   exakt vilken tjänst koden gäller — modalen säger "Detta gäller Ratsit" och inget annat är
   möjligt att missa. Men mönstret tränar ändå in beteendet "skanna en kod någon annan visar",
   och det är det beteendet som gör riktiga bedrägerier möjliga. Väg det. Alternativet är
   `bankid://`-autostart på samma enhet, utan vidareförmedlad kod alls.

Kontrollera också Ratsits användarvillkor innan automationen körs mot dem skarpt.

## Verifiera skrapningen utan att röra någon skarp tjänst

`/mock/bankid` är en övningssajt som härmar formen på ett BankID-steg: en knapp som startar
identifieringen och därefter en kod som byts varje sekund. Sätt `FMN_MOCK_BANKID_URL` så körs
**exakt samma flödeskod** mot den i stället för mot den skarpa tjänsten.

```bash
PLAYWRIGHT_CHROMIUM_PATH=/sökväg/till/chrome \
FMN_MOCK_BANKID_URL="http://127.0.0.1:3000/mock/bankid?signAfter=9000" \
npm run dev
```

Sedan, mot en skapad begäran:

```bash
curl -sN localhost:3000/api/requests/$ID/automation/ratsit
```

Övningssajten kör hela formen: knapp → kod som byts varje sekund → inloggad → kryssruta och
bekräftaknapp. Sista biten finns för att `postAuthSteps` ska gå att verifiera.

Verifierat 2026-08-14 med tre tjänster i kö: `Ratsit → Hitta.se → Merinfo`, i den ordningen,
en kod åt gången, nästa startad först när föregående var klar. Fyra unika koder per tjänst,
kryssrutan ikryssad, begäran skickad, alla tre `SUBMITTED`.

Övningssajten använder en **egen** konfiguration, inte tjänsternas riktiga selektorer med bara
adressen utbytt. Poängen är att verifiera maskineriet — navigera, hitta koden, strömma den,
upptäcka inloggningen, fylla i formuläret, bekräfta. Att köra Ratsits ogissade selektorer mot
en sida de inte är skrivna för hade bevisat ingenting.

Sajten har ingenting med riktig BankID att göra och genererar ingen giltig kod.

## Lägga till en tjänst

BankID-tjänst: anropa `bankIdProvider()` med en `BankIdFlowConfig` och lägg den i
`src/core/registry.ts`. Annan metod: skriv en `RemovalProvider` för hand.

1. **Deklarera bara fält du kan motivera.** Skälet visas ordagrant för användaren.
2. **Sätt `verified: false` tills selektorerna är avlästa mot skarp sajt.** Då lämnar flödet över
   till användaren i stället för att klicka blint. Hellre det än ett automatiserat formulär byggt
   på gissningar.

## Vad som inte är byggt

- **Kö.** Webbläsaren körs i Next-processen. En instans per samtidig användare är inte något en
  webbserver ska bära — flytta till en worker bakom BullMQ innan riktig trafik.
- **Verifierade selektorer.** Ingen av tjänsternas DOM är avläst. Se tabellen ovan.
- **Lagring som överlever omstart.** `store.ts` är i minnet med två timmars TTL. `RequestStore`
  är formen en Postgres-adapter ska ha; skriv kryptering i vila och automatisk radering samtidigt.
- **Utskick av e-postbegäran.** Upplysning-providern formulerar men skickar inte.
- **Bevakningen.** Att söka på användaren igen och säga till när hon dyker upp. Uttryckligen inte
  MVP (2026-08-17) och finns inte längre någonstans i repot — nedräkningen som fanns i den statiska
  sajten är borttagen. Se rotens README.

## Paletten och rankan

`src/app/globals.css` är tjänstens motsvarighet till `assets/tokens.css` — enda stället där
färgvärden får definieras. `--color-bud` (rosa) markerar exakt ett tillstånd, utgången spärr.
Tjänsten har ingen nedräkning, alltså används rosa inte alls här. Lägg den inte på `FAILED`.

`VineBackground.tsx` är förgätmigejen som växer i bakgrunden: stjälkarna ritas fram, bladen
vecklar ut sig, blommorna slår ut nedifrån och upp. Alla färger hämtas via `var(--color-*)`,
så rankan kan inte glida isär från paletten.

**Den har inga rosa knoppar.** En riktig *Myosotis* har det, och de hade suttit vackert. Men
regel 3 ger `--color-bud` exakt en betydelse i produkten, och en dekorativ knopp hade blivit
en andra. Blomman går från grön knopp till blå — botaniskt fattigare, regelmässigt rätt.

Två fällor som redan är trampade i:

- **Bottenfärgen sätts bara på `html`.** Sätts den även på `body` målar body-bakgrunden över
  allt på negativ z-index, och rankan försvinner utan att något ser trasigt ut.
- **`vine-sway` animerar `rotate`, aldrig `transform`.** Tailwinds `-translate-x-1/2` sätter
  CSS-egenskapen `translate`; en `transform` läggs ovanpå den i stället för att ersätta, och
  rankan hamnar en halv bredd för långt åt vänster.

Vid `prefers-reduced-motion` ritas rankan färdigvuxen och stilla.

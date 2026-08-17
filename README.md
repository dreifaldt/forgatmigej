# Förgätmigej

Ta bort dina uppgifter från svenska personsöktjänster. Du väljer sajterna, tjänsten gör begäran.

Gratis, inget konto. Repot är två delar: den statiska sajten i roten (inga beroenden, ingen build)
och `service/`, Next.js-appen som genomför borttagningarna.

## Problemet

Ratsit, Hitta.se, MrKoll, Merinfo, Eniro och Upplysning.se har **utgivningsbevis**
från Mediemyndigheten. Det ger grundlagsskydd enligt yttrandefrihetsgrundlagen, och innebär att
GDPR:s raderingsrätt inte biter på dem. Du kan alltså inte kräva att bli raderad.

Det som finns är sajternas egna, frivilliga borttagningar. Tre saker gör dem svåra att leva med:

1. **De är omständliga.** Sex sajter, sex olika rutiner — BankID hos några, formulär eller e-post
   hos andra. De flesta ger upp efter den andra.
2. **De raderar inte.** Uppgifterna ligger kvar i sajternas register — de blir bara osökbara publikt.
3. **Uppgifterna kommer tillbaka.** Sajterna hämtar nya uttag ur offentliga register med jämna
   mellanrum, och dolda profiler kan återskapas.

Punkt 1 är det Förgätmigej löser: en begäran per sajt, i tur och ordning, utan att du behöver
lära dig sex olika formulär. Punkt 3 betyder att det inte är gjort en gång för alla — men då är
det bara att begära borttagning igen.

## Vad tjänsten gör

1. **Du väljer sajterna.** Alla är förvalda; kryssa bort dem du vill vara kvar på.
2. **Tjänsten gör begäran.** Kräver sajten BankID legitimerar du dig i din egen app mot sajtens
   egen kod — resten av formuläret fylls i bakom kulisserna.
3. **Du får en kvittens.** Vilka sajter som fått begäran, plus beskedet att de kan återpublicera
   dig — och en knapp för att göra om det när de gör det.

Steg 2 och 3 bor i `service/`. Roten är landningssidan och urvalet.

## Vad tjänsten inte gör

- Frågar aldrig efter ditt personnummer. Kräver sajten BankID signerar du direkt hos dem.
- Signerar aldrig åt dig, och lagrar ingen BankID-hemlighet.
- Frågar bara om det en vald sajt faktiskt kräver, när den kräver det. Fyra av sex sajter: noll fält.
- Sparar ingenting i den statiska sajten — allt försvinner när fliken stängs.
- Är inte juridisk rådgivning. Rutiner ändras utan förvarning.

## Filer i roten

| Fil | Vad det är |
|---|---|
| `index.html` | Landningssidan, urvalet och sammanställningen. |
| `brand.html` | Färgpalett med botanisk plansch. |
| `404.html` | Felsida. |
| `assets/tokens.css` | **Enda stället där färgvärden bor.** |
| `assets/favicon.svg` | Märket. |
| `CNAME` | Domänen Pages ska svara på. |

Sajterna ligger i arrayen `SITES` i `index.html`. Det är den enda platsen som behöver röras när
något ändras hos dem. Fältet `days:` används inte av MVP — det hör till bevakningen, se nedan.

## Kör lokalt

Öppna `index.html` i en webbläsare. Eller `python3 -m http.server 8000` för rena adresser.

## Publicera

Ett workflow (`.github/workflows/deploy-pages.yml`) publicerar automatiskt vid varje push till
`main` som rör en fil i roten. Engångsinställning innan det fungerar:

**Settings → Pages → Source: `GitHub Actions`** (inte "Deploy from a branch").

```bash
git push origin main   # fjärranslutningen är redan inlagd
```

Sajten dyker upp på `https://dreifaldt.github.io/forgatmigej/` efter en minut eller två. Ändringar
i `service/` triggar inget — workflowet lyssnar bara på filerna i roten.

### Domän

Sajten ska ligga på **forgatmigej.dreifaldt.com**. Filen `CNAME` i roten är redan ifylld.

1. Hos DNS-leverantören för `dreifaldt.com`: skapa en **CNAME-post** `forgatmigej` som pekar på
   `dreifaldt.github.io` (utan reponamnet).
2. **Settings → Pages → Custom domain** → `forgatmigej.dreifaldt.com` → Save.
3. Vänta tills DNS-kontrollen blir grön, kryssa sedan i **Enforce HTTPS**.
4. Verifiera domänen under **Settings → Pages → Verified domains**.

#### Varför inte förgätmigej.dreifaldt.com

GitHub Pages kräver punycode för internationaliserade domännamn. Adressen hade blivit
`xn--frgtmigej-x2a9q.dreifaldt.com` i CNAME-filen, i TLS-certifikatet, i loggarna och i statistiken.
Namnet stavas med ä och ö överallt där det syns. Adressen är rörmokeri.

### Sökvägar till assets

`index.html` och `brand.html` använder relativa sökvägar och fungerar både på projektadressen och
på egen domän. `404.html` använder rotabsoluta eftersom Pages serverar den för godtyckliga
sökvägar. Följden: 404-sidan är ostilad tills egen domän är på plats.

### Varför `.nojekyll`

GitHub Pages kör annars filerna genom Jekyll, som hoppar över filer som börjar med understreck.

## Färg

Paletten är hämtad ur *Myosotis sylvatica*. Tre blå, ett gult öga, en vit ring, en rosa knopp,
två gröna. Knoppens rosa har fått en enda uppgift i produkten: markera utgången spärr.

Fullständig motivering och kontrastvärden finns i `brand.html`.

## Typsnitt

Fraunces för rubriker, Karla för brödtext. Google Fonts med lokala fallbacks.

## Att bygga härnäst

Ordningen är inte godtycklig — 1 blockerar att tjänsten öppnas för någon annan än dig själv.

1. **Verifiera selektorerna.** Alla sex providers har `verified: false`; ingen sajts DOM är avläst.
   Ett automatiserat klick på gissade fält skickas inte ut. Öppna sidan för hand, läs markup, fyll
   i selektorerna. Se `service/README.md`.
2. **Lagring som överlever omstart.** `service/src/core/store.ts` är i minnet med två timmars TTL.
   `RequestStore` är formen en Postgres-adapter ska ha; skriv kryptering i vila samtidigt.
3. **Kön ut ur webbservern.** Webbläsaren körs i Next-processen. Flytta till en worker bakom
   BullMQ innan riktig trafik.
4. **Källorna.** Reklamspärr i SPAR, NIX-spärr och operatörernas nummerupplysning stryper
   uppgifterna innan de når söktjänsterna. Egen sektion, inte en sajt bland de andra.
5. **IMY:s tillsyn.** Integritetsskyddsmyndigheten har intagit ståndpunkten att den kan utöva
   tillsyn även över tjänster med frivilligt utgivningsbevis. Rättsläget kan alltså röra sig —
   bevaka det innan du skriver något tvärsäkert om GDPR på sajten.

### Senare: bevakning

**Inte MVP** (beslutat 2026-08-17). Att söka på sig själv hos sajterna med jämna mellanrum och
säga till när man dyker upp igen — scanning plus bevakning. Det förutsätter att steg 1–3 ovan är
klara, och drar in både lagring och en avisering (e-post kräver adress; en `.ics` att ladda ner
kräver ingenting alls).

Den nedräkning som fanns i roten fram till 2026-08-17 var ett första försök i den riktningen. Den
är borttagen ur `index.html` men finns kvar i historiken (fram till commit `3befe45`) — inklusive
`SITES.days`, `driftLine()` och spärrlinjen med den rosa knoppen. Hämta därifrån hellre än att
rita om den.

## Licens

Ingen öppen licens. Repot är publikt för att GitHub Pages kräver det på gratisplanen — inte som en
inbjudan att återanvända varumärket. Alla rättigheter förbehållna.

# Förgätmigej

Håll koll på när dina spärrar hos svenska personsöktjänster löper ut.

Gratis. Statisk sajt, inga beroenden, ingen build, inget konto.

## Problemet

Ratsit, Hitta.se, MrKoll, Merinfo, Eniro, Birthday.se och Upplysning.se har **utgivningsbevis**
från Mediemyndigheten. Det ger grundlagsskydd enligt yttrandefrihetsgrundlagen, och innebär att
GDPR:s raderingsrätt inte biter på dem. Du kan alltså inte kräva att bli raderad.

Det som finns är sajternas egna, frivilliga spärrar. Tre saker gör dem svåra att leva med:

1. **De löper ut.** Ratsit döljer dig i tolv månader, Hitta i trettiosex, MrKolls adressdöljning
   betydligt kortare. Ingen påminner dig.
2. **De raderar inte.** Uppgifterna ligger kvar i sajternas register — de blir bara osökbara publikt.
3. **Uppgifterna kommer tillbaka.** Sajterna hämtar nya uttag ur offentliga register med jämna
   mellanrum, och dolda profiler kan återskapas.

Sammantaget: borttagning är inte en uppgift man gör klart, utan en prenumeration på vaksamhet.
Det är den prenumerationen Förgätmigej håller reda på.

Namnet går åt rätt håll trots allt. Sajterna glömmer dig — men bara ett tag. Förgätmigej är det
som inte glömmer att påminna.

## Vad sajten gör

Landningssida som förklarar rättsläget, plus ett flöde i två steg:

1. Välj vilka tjänster du vill bevaka.
2. Kryssa i var du redan gjort spärren.

Därefter en lista med ett kort per tjänst: metod (BankID, formulär eller e-post), vad spärren
faktiskt åstadkommer, en direktlänk, och en nedräkning mot att spärren går ut. Knappen
*Jag har dolt mig* startar om nedräkningen.

## Vad sajten inte gör

- Skickar ingen begäran åt dig. Du gör spärren själv hos varje tjänst.
- Ber aldrig om personnummer eller BankID.
- Sparar ingenting — allt försvinner när fliken stängs.
- Är inte juridisk rådgivning. Rutiner och giltighetstider ändras utan förvarning.

## Filer

| Fil | Vad det är |
|---|---|
| `index.html` | Sajten. Landningssida plus flödet i två steg. |
| `brand.html` | Färgpalett med botanisk plansch. |
| `404.html` | Felsida. |
| `assets/tokens.css` | **Enda stället där färgvärden bor.** |
| `assets/favicon.svg` | Märket. |
| `CNAME` | Domänen Pages ska svara på. |

Tjänsterna och deras giltighetstider ligger i arrayen `SITES` i `index.html`. Det är den enda
platsen som behöver röras när något ändras hos sajterna.

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

1. **Lagring.** Nedräkningarna överlever inte en omladdning. localStorage först, konto sen —
   men ett konto drar in personuppgifter i en tjänst vars hela poäng är att slippa dem. Väg noga.
2. **Påminnelser.** Nedräkning utan avisering löser inte problemet. E-post kräver adress; en
   kalenderfil (.ics) att ladda ner kräver ingenting alls och är förmodligen rätt för v1.
3. **Kontrollera datan.** Giltighetstiderna i `SITES` bygger på vad sajterna uppgett publikt.
   Flera är okända. Verifiera var och en mot källan innan sajten går ut till andra än dig själv.
4. **Källorna.** Reklamspärr i SPAR, NIX-spärr och operatörernas nummerupplysning stryper
   uppgifterna innan de når söktjänsterna. Egen sektion, inte en sajt bland de andra.
5. **IMY:s tillsyn.** Integritetsskyddsmyndigheten har intagit ståndpunkten att den kan utöva
   tillsyn även över tjänster med frivilligt utgivningsbevis. Rättsläget kan alltså röra sig —
   bevaka det innan du skriver något tvärsäkert om GDPR på sajten.

## Licens

Ingen öppen licens. Repot är publikt för att GitHub Pages kräver det på gratisplanen — inte som en
inbjudan att återanvända varumärket. Alla rättigheter förbehållna.

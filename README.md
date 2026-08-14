# Förgätmigej

Varumärke och prototyp. Statisk sajt, inga beroenden, ingen build.

> **Status:** paletten och den grafiska identiteten är klara och färdiga att bygga vidare på.
> Produkten är det inte. Innehållet i `index.html` är en platshållarprodukt — se *Öppen fråga* längst ned.

## Sidor

| Fil | Vad det är |
|---|---|
| `index.html` | Sajten. Landningssida plus ett fungerande flöde i tre steg. |
| `brand.html` | Färgpalett med botanisk plansch. Varje värde kopplat till sin del av blomman. |
| `404.html` | Felsida. |
| `assets/tokens.css` | **Enda stället där färgvärden bor.** Ändra här, aldrig i sidorna. |
| `assets/favicon.svg` | Märket. |

## Kör lokalt

Öppna `index.html` i en webbläsare. Det är allt.

Vill du ha rena adresser lokalt:

```bash
python3 -m http.server 8000
```

Sedan `http://localhost:8000`.

## Publicera på GitHub Pages

Repot ligger redan med en första commit på grenen `main`.

```bash
git remote add origin https://github.com/DITT-NAMN/forgatmigej.git
git push -u origin main
```

Därefter på github.com:

**Settings → Pages → Build and deployment → Source: `Deploy from a branch` → Branch: `main` / `(root)` → Save**

Sajten dyker upp på `https://DITT-NAMN.github.io/forgatmigej/` efter en minut eller två.

### Eget domännamn senare

Lägg en fil `CNAME` i roten med domänen som enda innehåll, peka DNS mot GitHub, och kryssa i *Enforce HTTPS*.

### Varför `.nojekyll`

GitHub Pages kör annars filerna genom Jekyll, som hoppar över mappar och filer som börjar med understreck. Tom fil, sparar en framtida felsökning.

## Färg

Paletten är hämtad ur *Myosotis sylvatica*. Tre blå, ett gult öga, en vit ring, en rosa knopp, två gröna.

Reglerna som gäller:

1. Ögat (`--fmn-eye`) och knoppen (`--fmn-bud`) är aldrig textfärger.
2. Gult möter blått bara med den vita ringen emellan.
3. `--fmn-blue-deep` är den enda blå som bär text.
4. Bottenfärgen är aldrig ren vit.
5. Högst en av knopp och öga syns åt gången i samma vy.

Fullständig motivering och kontrastvärden finns i `brand.html` och i kommentarerna i `tokens.css`.

## Typsnitt

Fraunces för rubriker, Karla för brödtext. Laddas från Google Fonts med lokala fallbacks (Georgia respektive Helvetica/Arial).

## Öppen fråga

**Vad gör Förgätmigej, och för vem?**

Namnet är blommans, inte produktens. Flödet som ligger i `index.html` just nu — påminnelser om att höra av dig till människor du inte vill tappa bort — är ett antagande, inte en beslutad produkt. Det ser färdigt ut, vilket gör det farligt: det är lätt att börja tro på det för att det finns.

Byt ut det innan någon utomstående ser sajten.

## Licens

Ingen öppen licens. Repot är publikt för att GitHub Pages kräver det på gratisplanen — inte som en inbjudan att återanvända varumärket. Alla rättigheter förbehållna.

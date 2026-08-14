import type { Locator, Page } from "playwright";

/**
 * Att hitta QR-koden på en sida vi inte kontrollerar.
 *
 * Tjänsterna renderar sin BankID-kod på olika sätt — canvas, inline-SVG, en img med
 * data-URL. Strategierna nedan provas i tur och ordning. Ingen av dem är hårdkodad mot
 * en klassnamnsträff hos en enskild sajt, eftersom sådana slutar fungera i tysthet
 * nästa gång tjänsten rör sin frontend.
 *
 * Hittas ingenting är rätt svar att lämna över till användaren, inte att gissa.
 */

const STRATEGIES: { name: string; selector: string }[] = [
  { name: "canvas", selector: "canvas" },
  { name: "img-data-url", selector: 'img[src^="data:image"]' },
  { name: "svg-qr", selector: 'svg[class*="qr" i], svg[id*="qr" i]' },
  { name: "container-qr", selector: '[class*="qr" i] canvas, [class*="qr" i] img, [class*="qr" i] svg' },
  { name: "testid-qr", selector: '[data-testid*="qr" i]' },
];

export interface QrTarget {
  readonly locator: Locator;
  readonly strategy: string;
}

/** Letar upp elementet som bär QR-koden. Returnerar null i stället för att gissa. */
export async function findQr(page: Page, timeoutMs = 15_000): Promise<QrTarget | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    for (const strategy of STRATEGIES) {
      const locator = page.locator(strategy.selector).first();
      try {
        if (await locator.isVisible({ timeout: 250 })) {
          const box = await locator.boundingBox();
          // En QR-kod är kvadratisk och inte pytteliten. Filtrerar bort logotyper
          // och spinners som råkar vara canvas-element.
          if (box && box.width >= 80 && box.height >= 80) {
            const ratio = box.width / box.height;
            if (ratio > 0.7 && ratio < 1.4) {
              return { locator, strategy: strategy.name };
            }
          }
        }
      } catch {
        // Strategin gav inget just nu. Nästa.
      }
    }
    await page.waitForTimeout(300);
  }

  return null;
}

/** Fotograferar QR-elementet som det ser ut just nu. */
export async function captureQr(target: QrTarget): Promise<string> {
  const buffer = await target.locator.screenshot({ type: "png" });
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/**
 * Har koden bytts sedan förra bilden? BankID roterar varje sekund, så en oförändrad
 * bild flera varv i rad betyder oftast att sidan gått vidare — eller att vi fotograferar
 * fel element.
 */
export function hasChanged(previous: string | null, next: string): boolean {
  return previous !== next;
}

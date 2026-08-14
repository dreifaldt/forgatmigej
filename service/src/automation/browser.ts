import { chromium, type Browser, type BrowserContext } from "playwright";

/**
 * Den osynliga webbläsaren.
 *
 * Headless — ingen fönsterruta, ingen skärm, ingenting användaren ser. Den behöver
 * ändå en viewport med storlek, eftersom en QR-kod inte går att rendera och fotografera
 * i en yta som är noll gånger noll. "Osynlig" och "nolldimensionell" är inte samma sak;
 * det är den första vi är ute efter.
 *
 * I den här MVP:n körs webbläsaren i samma process som Next. Innan riktig trafik ska
 * den flyttas till en worker bakom en kö (BullMQ enligt briefen) — en webbläsarinstans
 * per samtidig användare är inte något en webbserver ska bära.
 */

let shared: Browser | null = null;

function executablePath(): string | undefined {
  return process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
}

export async function getBrowser(): Promise<Browser> {
  if (shared?.isConnected()) return shared;
  const path = executablePath();
  shared = await chromium.launch({
    headless: true,
    ...(path ? { executablePath: path } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  return shared;
}

export async function newContext(): Promise<BrowserContext> {
  const browser = await getBrowser();
  return browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "sv-SE",
    timezoneId: "Europe/Stockholm",
    // Ärlig user-agent. Vi utger oss inte för att vara något vi inte är.
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Forgatmigej/0.1 (+https://forgatmigej.dreifaldt.com)",
  });
}

export async function closeBrowser(): Promise<void> {
  await shared?.close();
  shared = null;
}

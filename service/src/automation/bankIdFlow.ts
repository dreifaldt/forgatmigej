import type { Page } from "playwright";
import type { BankIdFlowConfig, PostAuthStep } from "./config";
import { captureQr, findQr } from "./qr";
import { QR_ORDER_TIMEOUT_MS, QR_REFRESH_MS, type FlowEvent, type SessionPhase } from "./types";

export interface FlowRunContext {
  readonly page: Page;
  readonly emit: (event: FlowEvent) => void;
  readonly cancelled: () => boolean;
  /** Uppgifter providern deklarerat, för postAuthSteps av typen fill. */
  readonly collected: Readonly<Record<string, string>>;
}

export type ScrapeFlow = (context: FlowRunContext) => Promise<void>;

/**
 * Identifieringsflödet: öppna tjänstens sida, ta oss till identifieringssteget, hämta
 * tjänstens egen kod, visa den vidare medan användaren skannar — och därefter klicka
 * igenom det som återstår så att användaren aldrig behöver se tjänstens formulär.
 *
 * VAD FLÖDET ALDRIG GÖR
 * Det signerar inte åt användaren. Det läser inte, lagrar inte och vidarebefordrar inte
 * någon hemlighet. Det finns ingen kod här som försöker gå runt identifieringen — koden
 * är tjänstens egen, ordern är tjänstens egen, och det är användarens egen app som
 * slutför den.
 */
export function bankIdFlow(config: BankIdFlowConfig): ScrapeFlow {
  return async ({ page, emit, cancelled, collected }: FlowRunContext) => {
    const phase = (p: SessionPhase, message: string) => emit({ type: "phase", phase: p, message });

    phase("navigating", `Öppnar ${config.providerName}`);
    await page.goto(config.startUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });

    phase("locating", `Letar upp inloggningen hos ${config.providerName}`);
    for (const trigger of config.startTriggers) {
      if (cancelled()) return;
      try {
        const locator = page.locator(trigger).first();
        if (await locator.isVisible({ timeout: 2_000 })) {
          await locator.click({ timeout: 5_000 });
          await page.waitForTimeout(600);
        }
      } catch {
        // Knappen fanns inte. Nästa i listan.
      }
    }

    phase("locating", "Hämtar koden");
    const target = await findQr(page, config.verified ? 15_000 : 8_000);

    if (!target) {
      emit({
        type: "manual",
        url: config.startUrl,
        instructions: config.manualInstructions,
        message: `Vi kom inte in hos ${config.providerName} på egen hand. Hellre det än att klicka blint.`,
      });
      return;
    }

    phase("awaiting_scan", `Skanna koden för att legitimera dig hos ${config.providerName}`);

    const started = Date.now();
    let sequence = 0;
    let previous: string | null = null;

    while (!cancelled()) {
      if (await anyVisible(page, config.successSignals)) break;

      if (Date.now() - started > QR_ORDER_TIMEOUT_MS + 5_000) {
        emit({
          type: "failed",
          message: `Koden hann gå ut innan den skannades. Starta om ${config.providerName} så hämtar vi en ny.`,
        });
        return;
      }

      let dataUrl: string;
      try {
        dataUrl = await captureQr(target);
      } catch {
        break; // Elementet försvann — sidan har troligen gått vidare.
      }

      if (dataUrl !== previous) {
        previous = dataUrl;
        sequence += 1;
        emit({
          type: "qr",
          frame: { dataUrl, sequence, capturedAt: Date.now() },
          expiresInMs: Math.max(0, QR_ORDER_TIMEOUT_MS - (Date.now() - started)),
        });
      }

      await page.waitForTimeout(QR_REFRESH_MS);
    }

    if (cancelled()) return;

    phase("verifying", `Du är inloggad hos ${config.providerName}`);
    await page.waitForTimeout(800);

    // Resten av tjänstens formulär, klickat åt användaren.
    if (config.postAuthSteps?.length) {
      for (const step of config.postAuthSteps) {
        if (cancelled()) return;
        phase("submitting", step.label);
        const ok = await runStep(page, step, collected);
        if (!ok && !config.verified) {
          emit({
            type: "manual",
            url: config.startUrl,
            instructions: config.manualInstructions,
            message: `Vi kom in hos ${config.providerName}, men känner inte igen deras formulär. Sista biten behöver göras för hand.`,
          });
          return;
        }
      }
    }

    const completionSignals = config.completionSignals ?? config.successSignals;
    const completed = await anyVisible(page, completionSignals, 5_000);

    if (!completed && !config.verified) {
      emit({
        type: "manual",
        url: config.startUrl,
        instructions: config.manualInstructions,
        message: `Vi fick ingen bekräftelse från ${config.providerName}. Kontrollera sista steget själv.`,
      });
      return;
    }

    emit({ type: "done", message: `Klart hos ${config.providerName}` });
  };
}

async function runStep(
  page: Page,
  step: PostAuthStep,
  collected: Readonly<Record<string, string>>,
): Promise<boolean> {
  if (step.kind === "wait") {
    await page.waitForTimeout(step.ms);
    return true;
  }

  for (const selector of step.selectors) {
    try {
      const locator = page.locator(selector).first();
      if (!(await locator.isVisible({ timeout: 2_500 }))) continue;

      if (step.kind === "click") {
        await locator.click({ timeout: 5_000 });
      } else if (step.kind === "check") {
        await locator.check({ timeout: 5_000 });
      } else {
        const value = collected[step.field];
        // Fyller aldrig i något valvet inte har. Tomt fält = hoppa, inte gissa.
        if (!value) return false;
        await locator.fill(value, { timeout: 5_000 });
      }

      await page.waitForTimeout(500);
      return true;
    } catch {
      // Nästa selektor.
    }
  }

  return false;
}

async function anyVisible(
  page: Page,
  selectors: readonly string[],
  timeoutMs = 300,
): Promise<boolean> {
  for (const selector of selectors) {
    try {
      if (await page.locator(selector).first().isVisible({ timeout: timeoutMs })) return true;
    } catch {
      // Nästa.
    }
  }
  return false;
}

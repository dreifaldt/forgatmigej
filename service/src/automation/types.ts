/**
 * Automationens gränssnitt mot resten av tjänsten.
 *
 * Den dolda webbläsaren gör allt utom en sak: den identifierar sig aldrig åt användaren.
 * Signeringen utförs alltid av människan, med sin egen app, mot tjänstens egen order.
 * Automationen hämtar koden och visar den vidare — den läser aldrig, lagrar aldrig och
 * kringgår aldrig någon hemlighet.
 */

export type SessionPhase =
  | "starting"
  | "navigating"
  | "locating"
  | "awaiting_scan"
  | "verifying"
  | "submitting"
  | "done"
  | "manual"
  | "failed";

export interface QrFrame {
  /** data:image/png;base64,… — en stillbild av tjänstens egen kod. */
  readonly dataUrl: string;
  /** Löpnummer. Koden byts varje sekund, så bilden är färskvara. */
  readonly sequence: number;
  readonly capturedAt: number;
}

/** Vad flödet självt rapporterar. Kön märker upp det med vilken tjänst det gäller. */
export type FlowEvent =
  | { type: "phase"; phase: SessionPhase; message: string }
  | { type: "qr"; frame: QrFrame; expiresInMs: number }
  | { type: "done"; message: string }
  | { type: "manual"; url: string; instructions: readonly string[]; message: string }
  | { type: "failed"; message: string };

export type QueueItemState = "pending" | "active" | "done" | "manual" | "failed";

export interface QueueItem {
  readonly providerId: string;
  readonly providerName: string;
  readonly state: QueueItemState;
}

/** Vad klienten får. Allt utom `queue` och `all_done` gäller en bestämd tjänst. */
export type ScrapeEvent =
  | { type: "queue"; items: readonly QueueItem[] }
  | ({ providerId: string; providerName: string } & FlowEvent)
  | { type: "all_done"; message: string };

export interface AutomationHandle {
  readonly id: string;
  subscribe(listener: (event: ScrapeEvent) => void): () => void;
  /** Senaste händelserna, så att en sen prenumerant inte missar koden. */
  replay(): readonly ScrapeEvent[];
  cancel(): Promise<void>;
  readonly finished: Promise<void>;
}

/**
 * Koden roteras varje sekund och ordern avbryts efter trettio utan skanning. Båda talen
 * kommer från BankID:s egen dokumentation och är designade just för att en stillbild inte
 * ska gå att flytta till en annan skärm. Sänk inte takten.
 */
export const QR_REFRESH_MS = 1000;
export const QR_ORDER_TIMEOUT_MS = 30_000;
export const SIGN_TIMEOUT_MS = 120_000;

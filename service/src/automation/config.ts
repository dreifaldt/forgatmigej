/**
 * Konfiguration för ett skrapat identifieringsflöde. Ren data, inga beroenden — så att
 * providers och core kan läsa den utan att dra in Playwright.
 */

/** Ett steg den dolda webbläsaren tar efter att användaren identifierat sig. */
export type PostAuthStep =
  | { readonly kind: "click"; readonly selectors: readonly string[]; readonly label: string }
  | { readonly kind: "check"; readonly selectors: readonly string[]; readonly label: string }
  /** Fyller ett fält med en uppgift ur valvet. Providern måste ha deklarerat fältet. */
  | {
      readonly kind: "fill";
      readonly selectors: readonly string[];
      readonly field: string;
      readonly label: string;
    }
  | { readonly kind: "wait"; readonly ms: number; readonly label: string };

export interface BankIdFlowConfig {
  readonly providerName: string;
  readonly startUrl: string;
  /** Klickas i tur och ordning för att nå identifieringssteget. */
  readonly startTriggers: readonly string[];
  /** Syns någon av dessa är signeringen klar. */
  readonly successSignals: readonly string[];
  /**
   * Det som återstår efter identifieringen: kryssa i, bekräfta, skicka. Körs av den
   * dolda webbläsaren så att användaren aldrig behöver se tjänstens eget formulär.
   */
  readonly postAuthSteps?: readonly PostAuthStep[];
  /** Syns någon av dessa är själva borttagningen bekräftad. */
  readonly completionSignals?: readonly string[];
  /**
   * Har selektorerna bekräftats mot den skarpa sajten?
   *
   * false = flödet får försöka, men lämnar över till användaren så fort något inte
   * stämmer, i stället för att klicka blint i ett formulär vi aldrig sett.
   */
  readonly verified: boolean;
  readonly manualInstructions: readonly string[];
}

export type AutomationDescriptor = { readonly kind: "bankid"; readonly config: BankIdFlowConfig };

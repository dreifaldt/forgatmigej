import type { BankIdFlowConfig } from "@/automation/config";
import type { RemovalProvider } from "@/core/types";
import { bankIdProvider } from "./bankIdProvider";

/**
 * Ratsit — https://www.ratsit.se/tabort
 *
 * Sidan verifierad 2026-08-14: den kräver BankID och ingenting annat. Ordagrant
 * "Identifiera dig med BankID nedan för att ta bort dig på Ratsit", med knappen
 * "Ta bort dig från Ratsit". Inga formulärfält.
 *
 * SELEKTORERNA NEDAN ÄR INTE VERIFIERADE.
 * Sidans text är läst, men DOM:en bakom BankID-steget har inte inspekterats — att göra
 * det hade krävt att vi startade en skarp BankID-order mot Ratsits konto, vilket vi inte
 * gör för att kartlägga en sajt. `verified: false` gör att flödet lämnar över till
 * användaren så fort något inte stämmer i stället för att klicka blint.
 *
 * ATT GÖRA: öppna sidan för hand, läs av knappens och QR-elementets faktiska markup,
 * fyll i listorna nedan och sätt verified: true.
 */
const config: BankIdFlowConfig = {
  providerName: "Ratsit",
  startUrl: "https://www.ratsit.se/tabort",
  startTriggers: [
    'button:has-text("Ta bort dig från Ratsit")',
    'a:has-text("Ta bort dig från Ratsit")',
    'button:has-text("Identifiera dig med BankID")',
    'button:has-text("BankID")',
  ],
  successSignals: [':text("Mina sidor")', ':text("Logga ut")', '[class*="logged-in" i]'],
  // Det som återstår efter inloggningen, klickat åt användaren så att hon aldrig
  // behöver se Ratsits formulär. Gissade selektorer — se verified: false nedan.
  postAuthSteps: [
    { kind: "click", selectors: ['button:has-text("Ta bort mina uppgifter")'], label: "Väljer borttagning hos Ratsit" },
    { kind: "check", selectors: ['input[type="checkbox"]'], label: "Godkänner villkoren hos Ratsit" },
    { kind: "click", selectors: ['button:has-text("Bekräfta")', 'button:has-text("Ta bort")'], label: "Skickar begäran till Ratsit" },
  ],
  completionSignals: [':text("Du är borttagen")', ':text("Din begäran är mottagen")', '[class*="success" i]'],
  verified: false,
  manualInstructions: [
    "Öppna ratsit.se/tabort.",
    "Klicka på Ta bort dig från Ratsit och identifiera dig med BankID.",
    "Kom tillbaka hit och markera steget som gjort.",
  ],
};

export const ratsit: RemovalProvider = bankIdProvider({
  id: "ratsit",
  name: "Ratsit",
  summary: "Hela den publika profilen döljs och försvinner ur Googles resultat.",
  // OVERIFIERAD. Talet kommer från SITES i den statiska sajten. Kontrollerat
  // 2026-08-14 mot Ratsits egna sidor: de anger ingen giltighetstid publikt.
  // Visa det aldrig som ett löfte i UI:t — se caveat nedan.
  validForDays: 365,
  config,
  caveat: "Hur länge spärren gäller säger Ratsit inte öppet, så sök på dig själv då och då.",
});

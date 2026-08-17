import type { BankIdFlowConfig } from "@/automation/config";
import type { RemovalProvider } from "@/core/types";
import { bankIdProvider } from "./bankIdProvider";

/**
 * Hitta.se, Merinfo och Eniro — samtliga BankID, samtliga med OVERIFIERADE selektorer.
 *
 * Metod och giltighetstid kommer från `SITES` i den statiska sajten. De uppgifterna är
 * publikt hämtade och delvis overifierade; se README → "Att bygga härnäst". Flödena får
 * försöka, men `verified: false` gör att de lämnar över till användaren i stället för
 * att gissa sig igenom ett formulär vi aldrig sett.
 */

function draft(name: string, url: string): BankIdFlowConfig {
  return {
    providerName: name,
    startUrl: url,
    startTriggers: [
      'button:has-text("BankID")',
      'a:has-text("BankID")',
      'button:has-text("Dölj")',
      'a:has-text("Dölj mina uppgifter")',
      'a:has-text("Ta bort")',
    ],
    successSignals: [':text("Logga ut")', ':text("Mina sidor")', '[class*="logged-in" i]'],
    postAuthSteps: [
      { kind: "click", selectors: ['button:has-text("Dölj mina uppgifter")', 'button:has-text("Ta bort")'], label: `Väljer borttagning hos ${name}` },
      { kind: "check", selectors: ['input[type="checkbox"]'], label: `Godkänner villkoren hos ${name}` },
      { kind: "click", selectors: ['button:has-text("Bekräfta")', 'button[type="submit"]'], label: `Skickar begäran till ${name}` },
    ],
    completionSignals: [':text("Tack")', ':text("mottagen")', ':text("borttagen")', '[class*="success" i]'],
    verified: false,
    manualInstructions: [
      `Öppna ${name} och sök upp dig själv.`,
      "Välj att dölja eller ta bort dina uppgifter och identifiera dig med BankID.",
      "Kom tillbaka hit och markera steget som gjort, så startar nedräkningen.",
    ],
  };
}

export const hitta: RemovalProvider = bankIdProvider({
  id: "hitta",
  name: "Hitta.se",
  summary: "Uppgifterna döljs i sajtens sök. Raderas inte ur källregistret.",
  // OVERIFIERAD, som alla tal här. Hitta.se anger ingen giltighetstid publikt
  // (kontrollerat mot hitta.se/din-integritet 2026-08-14).
  validForDays: 1095,
  config: draft("Hitta.se", "https://www.hitta.se"),
  caveat: "Hur länge spärren gäller säger Hitta.se inte öppet, så sök på dig själv då och då.",
});

export const merinfo: RemovalProvider = bankIdProvider({
  id: "merinfo",
  name: "Merinfo",
  summary: "Uppgifterna döljs inom några dagar.",
  validForDays: null,
  config: draft("Merinfo", "https://www.merinfo.se"),
  caveat: "Giltighetstiden är inte offentligt angiven, så sök på dig själv då och då.",
});

export const eniro: RemovalProvider = bankIdProvider({
  id: "eniro",
  name: "Eniro",
  summary: "Begäran om borttagning görs via uppdateringssidan.",
  validForDays: null,
  config: draft("Eniro", "https://www.eniro.se"),
  caveat: "Giltighetstiden är inte offentligt angiven, så sök på dig själv då och då.",
});

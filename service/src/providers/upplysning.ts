import { field } from "@/core/fields";
import type { RemovalContext, RemovalProvider, RemovalStep } from "@/core/types";

/**
 * Upplysning.se — borttagning via e-post. OVERIFIERAD.
 *
 * Metod och not kommer från `SITES` i den statiska sajten: "Mejla med namn, adress och
 * länken till din sida." Vi begär namn och e-post direkt. Adressen efterfrågas aldrig —
 * en länk till rätt profil pekar ut samma post och är den mindre känsliga av de två.
 *
 * Länken begärs dessutom först när den behövs: går namnet att peka ut entydigt skickas
 * begäran utan den. Det är den enda tjänsten i registret som fortfarande visar ett fält
 * som dyker upp mitt i flödet — resten är BankID och begär ingenting alls.
 */
export const upplysning: RemovalProvider = {
  id: "upplysning",
  name: "Upplysning.se",
  url: "https://www.upplysning.se",
  authenticationMethod: "EMAIL",
  summary: "Borttagning ur publika söket.",
  validForDays: null,

  getRequiredInformation(context: RemovalContext) {
    const required = [
      field(
        "firstName",
        "Upplysning.se tar emot begäran som fritext i ett mejl. Namnet är det som pekar ut vem begäran gäller.",
      ),
      field("lastName", "Samma skäl — utan efternamn går det inte att hitta rätt post."),
      field(
        "email",
        "Vi skickar begäran i ditt namn och behöver en adress att sätta som avsändare, så att svaret går till dig.",
      ),
    ];

    // Uppstår först när uppslaget visat sig tvetydigt. Före det: fältet finns inte.
    if (context.providerState.ambiguousMatch === true) {
      required.push(profileLinkField());
    }

    return required;
  },

  async advance(context: RemovalContext): Promise<RemovalStep> {
    const { firstName, lastName, profileUrl } = context.collected;

    if (context.providerState.lookupDone !== true) {
      const matches = await lookupProfiles(`${firstName ?? ""} ${lastName ?? ""}`.trim());

      if (matches > 1 && !profileUrl) {
        return {
          kind: "need_information",
          providerState: { lookupDone: true, ambiguousMatch: true, matches },
          fields: [profileLinkField()],
          note: `Vi hittade ${matches} profiler med det namnet.`,
        };
      }

      return {
        kind: "continue",
        providerState: { lookupDone: true, ambiguousMatch: false, matches },
        note: `uppslag klart, ${matches} träff(ar)`,
      };
    }

    return {
      kind: "submitted",
      note: "Begäran är skickad. Svar går till din e-postadress.",
    };
  },

  requiresUserInteraction() {
    return false;
  },
};

function profileLinkField() {
  return field(
    "profileUrl",
    "Vi hittade flera profiler med ditt namn hos Upplysning.se. Länken till din sida låter oss peka ut exakt rätt post, i stället för att be dig om din adress.",
  );
}

/**
 * Platshållare för profiluppslaget.
 *
 * Byts mot ett riktigt uppslag när skrapningen av Upplysning.se är verifierad.
 * Returnerar avsiktligt 2 för namn som innehåller "Andersson", så att den tvetydiga
 * grenen går att köra utan att träffa sajten.
 */
async function lookupProfiles(name: string): Promise<number> {
  if (!name) return 0;
  return /andersson/i.test(name) ? 2 : 1;
}

import { field } from "@/core/fields";
import type { RemovalContext, RemovalProvider, RemovalStep } from "@/core/types";

/**
 * MrKoll — OVERIFIERAD.
 *
 * MrKoll svarar 403 på automatiserad hämtning, så flödet har inte kunnat läsas av.
 * Providern är därför medvetet konservativ: den begär det minsta som rimligen krävs
 * för att peka ut en post i ett adressbaserat register, och lämnar sedan över till
 * användaren i stället för att gissa sig igenom ett formulär vi inte har sett.
 *
 * ATT GÖRA innan den här providern får automatisera något:
 *   1. Läs av det faktiska formuläret på mrkoll.se manuellt.
 *   2. Bekräfta vilka fält som är obligatoriska — ta bort resten härifrån.
 *   3. Bekräfta giltighetstiden. `validForDays: 30` kommer från SITES i den statiska
 *      sajten och är publikt hämtad men inte verifierad mot källan.
 *
 * Så länge punkterna ovan står kvar returnerar advance() `manual`. Det är rätt
 * beteende: hellre ett ärligt "gör det här steget själv" än ett automatiserat
 * formulär byggt på gissade fältnamn.
 */
export const mrkoll: RemovalProvider = {
  id: "mrkoll",
  name: "MrKoll",
  url: "https://mrkoll.se",
  authenticationMethod: "MANUAL",
  summary: "Oftast döljs bara adress och telefonnummer — posten ligger kvar.",
  validForDays: 30,

  getRequiredInformation(_context: RemovalContext) {
    return [
      field("firstName", "MrKolls register är sorterat på namn och adress. Namnet behövs för att hitta rätt post."),
      field("lastName", "Samma skäl som förnamnet."),
      field(
        "postalCode",
        "MrKoll listar flera personer med samma namn. Postnumret skiljer dem åt utan att vi behöver be om din fullständiga adress.",
      ),
    ];
  },

  async advance(_context: RemovalContext): Promise<RemovalStep> {
    return {
      kind: "manual",
      url: "https://mrkoll.se",
      note: "Vi kunde inte slutföra det här automatiskt.",
      instructions: [
        "Öppna MrKoll och sök upp dig själv med namn och postnummer.",
        "Välj att dölja dina uppgifter på din egen post.",
        "Kom tillbaka hit och markera steget som gjort, så startar nedräkningen.",
      ],
    };
  },

  requiresUserInteraction() {
    return true;
  },
};

import type { BankIdFlowConfig } from "@/automation/config";
import type { RemovalContext, RemovalProvider, RemovalStep } from "@/core/types";

/**
 * Fabrik för de tjänster som identifierar med BankID.
 *
 * Alla har samma form: de begär **noll personuppgifter** av oss, eftersom BankID
 * identifierar användaren direkt hos tjänsten. Personnumret passerar aldrig våra
 * system. Det är den enklaste tänkbara varianten av progressiv insamling — vi frågar
 * inte om något alls, för ingenting krävs.
 */
export function bankIdProvider(input: {
  id: string;
  name: string;
  summary: string;
  validForDays: number | null;
  config: BankIdFlowConfig;
  /** Extra rad i UI:t när tjänstens flöde inte är verifierat mot skarp sajt. */
  caveat?: string;
}): RemovalProvider {
  return {
    id: input.id,
    name: input.name,
    url: input.config.startUrl,
    authenticationMethod: "BANKID",
    summary: input.summary,
    validForDays: input.validForDays,
    automation: { kind: "bankid", config: input.config },

    getRequiredInformation() {
      // Noll fält. Tjänsten identifierar användaren själv.
      return [];
    },

    async advance(context: RemovalContext): Promise<RemovalStep> {
      if (context.providerState.bankIdConfirmed !== true) {
        return {
          kind: "need_user_action",
          action: {
            type: "BANKID",
            url: input.config.startUrl,
            label: `Identifiera dig mot ${input.name}`,
          },
          note:
            `${input.name} vill veta att det är du. Vi öppnar deras sida åt dig och hämtar ` +
            `deras kod hit — du legitimerar dig i din egen app, och vi ser varken ditt ` +
            `personnummer eller din signatur.`,
        };
      }

      return {
        kind: "submitted",
        note: input.caveat
          ? `Borttagningen är begärd hos ${input.name}. ${input.caveat}`
          : `Borttagningen är begärd hos ${input.name}.`,
      };
    },

    requiresUserInteraction() {
      return true;
    },
  };
}

import type { FieldDefinition, FieldId } from "./fields";
import type {
  FieldRequestRecord,
  RemovalContext,
  RemovalProvider,
  RemovalStatus,
  RemovalStep,
  UserAction,
} from "./types";

/**
 * Motorn bakom progressiv uppgiftsinsamling.
 *
 * Kärnan är loopen i `runUntilBlocked`: före *varje* steg frågas providern på nytt vad
 * den behöver. Det är skillnaden mot ett formulär. Ett formulär frågar en gång, i
 * förväg, om allt som någonsin kan tänkas behövas. Här får svaret ändras mellan varv,
 * och flödet stannar i samma sekund som ett nytt behov uppstår.
 */

const MAX_STEPS_PER_RUN = 12;

export type Pending =
  | { kind: "need_information"; fields: readonly FieldDefinition[]; note?: string }
  | { kind: "need_user_action"; action: UserAction; note: string }
  | { kind: "manual"; url: string; instructions: readonly string[]; note: string }
  | { kind: "settled"; note: string };

export interface RunResult {
  readonly context: RemovalContext;
  readonly pending: Pending;
  /** Uppgifter som efterfrågats under körningen, med motivering. Underlag för kvitto och admin. */
  readonly requested: readonly FieldRequestRecord[];
  readonly log: readonly string[];
}

/** Vilka fält providern har deklarerat just nu. */
export function declaredFields(
  provider: RemovalProvider,
  context: RemovalContext,
): readonly FieldDefinition[] {
  return provider.getRequiredInformation(context);
}

/** Deklarerade fält som ännu inte besvarats och som inte är valfria. */
export function missingFields(
  provider: RemovalProvider,
  context: RemovalContext,
): readonly FieldDefinition[] {
  return declaredFields(provider, context).filter(
    (f) => !f.optional && !isAnswered(context.collected[f.id]),
  );
}

function isAnswered(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Ger providern en kontext som bara innehåller de uppgifter den själv har deklarerat.
 *
 * Detta är dataminimering som kod snarare än som policy. Har användaren lämnat sin
 * e-post till Birthday.se ligger den i körningens valv, men Ratsit-providern får aldrig
 * se den, eftersom Ratsit aldrig deklarerat fältet.
 */
export function scopeContextToProvider(
  provider: RemovalProvider,
  context: RemovalContext,
): RemovalContext {
  const allowed = new Set<FieldId>(declaredFields(provider, context).map((f) => f.id));
  const scoped: Partial<Record<FieldId, string>> = {};
  for (const [key, value] of Object.entries(context.collected)) {
    if (allowed.has(key as FieldId) && value !== undefined) {
      scoped[key as FieldId] = value;
    }
  }
  return Object.freeze({ ...context, collected: Object.freeze(scoped) });
}

function withPatch(
  context: RemovalContext,
  patch: { status?: RemovalStatus; providerState?: Record<string, unknown>; lastError?: string },
): RemovalContext {
  return {
    ...context,
    status: patch.status ?? context.status,
    providerState: patch.providerState
      ? { ...context.providerState, ...patch.providerState }
      : context.providerState,
    ...(patch.lastError !== undefined ? { lastError: patch.lastError } : {}),
  };
}

function record(
  fields: readonly FieldDefinition[],
  providerId: string,
  at: string,
): FieldRequestRecord[] {
  return fields.map((f) => ({ providerId, fieldId: f.id, reason: f.reason, at }));
}

/**
 * Kör providern så långt det går utan att störa användaren, och stannar vid första
 * punkt som kräver något av hen — en uppgift, ett BankID, en manuell åtgärd.
 */
export async function runUntilBlocked(
  provider: RemovalProvider,
  start: RemovalContext,
  now: () => string = () => new Date().toISOString(),
): Promise<RunResult> {
  let context = start;
  const requested: FieldRequestRecord[] = [];
  const log: string[] = [];

  for (let step = 0; step < MAX_STEPS_PER_RUN; step++) {
    // 1. Fråga på nytt vad som krävs. Varje varv. Det här är hela poängen.
    const missing = missingFields(provider, context);
    if (missing.length > 0) {
      log.push(`${provider.id}: pausar, saknar ${missing.map((f) => f.id).join(", ")}`);
      return {
        context: withPatch(context, { status: "WAITING_FOR_USER" }),
        pending: { kind: "need_information", fields: missing },
        requested: [...requested, ...record(missing, provider.id, now())],
        log,
      };
    }

    // 2. Kör ett steg — med enbart de uppgifter providern deklarerat.
    let result: RemovalStep;
    try {
      result = await provider.advance(scopeContextToProvider(provider, context));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.push(`${provider.id}: steg kastade fel — ${message}`);
      return {
        context: withPatch(context, { status: "FAILED", lastError: message }),
        pending: { kind: "settled", note: "Något gick fel. Du kan försöka igen." },
        requested,
        log,
      };
    }

    switch (result.kind) {
      case "continue": {
        context = withPatch(context, {
          status: result.status ?? "IN_PROGRESS",
          ...(result.providerState ? { providerState: result.providerState } : {}),
        });
        if (result.note) log.push(`${provider.id}: ${result.note}`);
        continue;
      }

      case "need_information": {
        // Providern upptäckte ett behov mitt i flödet.
        context = withPatch(context, {
          status: "WAITING_FOR_USER",
          ...(result.providerState ? { providerState: result.providerState } : {}),
        });
        const stillMissing = result.fields.filter((f) => !isAnswered(context.collected[f.id]));
        if (stillMissing.length === 0) continue;
        log.push(`${provider.id}: begär ${stillMissing.map((f) => f.id).join(", ")} mitt i flödet`);
        return {
          context,
          pending: {
            kind: "need_information",
            fields: stillMissing,
            ...(result.note ? { note: result.note } : {}),
          },
          requested: [...requested, ...record(stillMissing, provider.id, now())],
          log,
        };
      }

      case "need_user_action": {
        context = withPatch(context, {
          status: result.action.type === "BANKID" ? "AUTHENTICATION_REQUIRED" : "WAITING_FOR_USER",
          ...(result.providerState ? { providerState: result.providerState } : {}),
        });
        return {
          context,
          pending: { kind: "need_user_action", action: result.action, note: result.note },
          requested,
          log,
        };
      }

      case "manual":
        return {
          context: withPatch(context, { status: "MANUAL_ACTION_REQUIRED" }),
          pending: {
            kind: "manual",
            url: result.url,
            instructions: result.instructions,
            note: result.note,
          },
          requested,
          log,
        };

      case "submitted":
        return {
          context: withPatch(context, { status: "SUBMITTED" }),
          pending: { kind: "settled", note: result.note },
          requested,
          log,
        };

      case "confirmed":
        return {
          context: withPatch(context, { status: "CONFIRMED" }),
          pending: { kind: "settled", note: result.note },
          requested,
          log,
        };

      case "failed":
        return {
          context: withPatch(context, { status: "FAILED", lastError: result.note }),
          pending: { kind: "settled", note: result.note },
          requested,
          log,
        };
    }
  }

  return {
    context: withPatch(context, { status: "FAILED", lastError: "Flödet snurrade utan att bli klart." }),
    pending: { kind: "settled", note: "Flödet fastnade. Försök igen eller gör steget manuellt." },
    requested,
    log,
  };
}

export function emptyContext(providerId: string): RemovalContext {
  return {
    providerId,
    status: "NOT_STARTED",
    collected: {},
    providerState: {},
    attempt: 0,
  };
}

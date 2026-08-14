import { type FieldId, isFieldId } from "./fields";
import { runUntilBlocked } from "./engine";
import { requireProvider } from "./registry";
import { type RemovalRequest, store } from "./store";
import type { FieldRequestRecord } from "./types";

/**
 * Sammanbindningen mellan motorn, valvet och HTTP-lagret.
 *
 * En viktig konsekvens av att valvet är gemensamt för hela begäran men projiceras per
 * provider: användaren behöver bara svara på en uppgift en gång, även om tre tjänster
 * råkar behöva den — samtidigt som ingen tjänst får se en uppgift den inte bett om.
 * "Fråga aldrig om samma sak två gånger" och dataminimering drar alltså åt samma håll.
 */

export interface PendingFieldView {
  id: FieldId;
  label: string;
  inputType: string;
  placeholder?: string;
  autoComplete?: string;
  /**
   * Ett skäl per tjänst som väntar på uppgiften.
   *
   * Två tjänster kan behöva samma uppgift av olika anledningar — MrKoll vill ha namnet
   * för att slå i ett adressregister, Birthday.se för att skriva ett mejl. Att visa
   * bara det ena skälet vore att svara på en fråga användaren inte ställde, så listan
   * bär alla. Uppgiften frågas ändå bara en gång.
   */
  reasons: { providerName: string; reason: string }[];
}

export async function advanceAll(request: RemovalRequest): Promise<RemovalRequest> {
  for (const providerId of request.providerIds) {
    const provider = requireProvider(providerId);
    const run = request.runs[providerId];
    if (!run) continue;

    // Kör inte vidare det som redan väntar på användaren.
    if (run.pending.kind === "need_user_action" || run.pending.kind === "manual") continue;
    if (run.context.status === "SUBMITTED" || run.context.status === "CONFIRMED") continue;

    const result = await runUntilBlocked(provider, {
      ...run.context,
      collected: request.vault.snapshot(),
    });

    request.vault.markRequested(result.requested);
    request.runs[providerId] = {
      providerId,
      context: result.context,
      pending: result.pending,
    };
  }

  store.save(request);
  return request;
}

/** Uppgifter som någon tjänst väntar på just nu, hopslagna så att var och en frågas en gång. */
export function pendingFields(request: RemovalRequest): PendingFieldView[] {
  const byId = new Map<FieldId, PendingFieldView>();

  for (const providerId of request.providerIds) {
    const run = request.runs[providerId];
    if (!run || run.pending.kind !== "need_information") continue;
    const providerName = requireProvider(providerId).name;

    for (const f of run.pending.fields) {
      const existing = byId.get(f.id);
      if (existing) {
        if (!existing.reasons.some((r) => r.providerName === providerName)) {
          existing.reasons.push({ providerName, reason: f.reason });
        }
        continue;
      }
      byId.set(f.id, {
        id: f.id,
        label: f.label,
        inputType: f.inputType,
        ...(f.placeholder ? { placeholder: f.placeholder } : {}),
        ...(f.autoComplete ? { autoComplete: f.autoComplete } : {}),
        reasons: [{ providerName, reason: f.reason }],
      });
    }
  }

  return [...byId.values()];
}

export function applyAnswers(
  request: RemovalRequest,
  answers: Record<string, string>,
): { accepted: FieldId[]; rejected: { id: string; problem: string }[] } {
  const accepted: FieldId[] = [];
  const rejected: { id: string; problem: string }[] = [];

  for (const [key, value] of Object.entries(answers)) {
    if (!isFieldId(key)) {
      rejected.push({ id: key, problem: "Okänt fält." });
      continue;
    }
    try {
      // Valvet vägrar uppgifter som ingen tjänst har efterfrågat.
      request.vault.set(key, value);
      accepted.push(key);
    } catch (error) {
      rejected.push({ id: key, problem: error instanceof Error ? error.message : String(error) });
    }
  }

  return { accepted, rejected };
}

/** Användaren bekräftar att hen gjort en åtgärd hos tjänsten (BankID, manuellt steg). */
export function confirmUserAction(request: RemovalRequest, providerId: string): void {
  const run = request.runs[providerId];
  if (!run) return;
  request.runs[providerId] = {
    ...run,
    context: {
      ...run.context,
      status: "IN_PROGRESS",
      providerState: { ...run.context.providerState, bankIdConfirmed: true, manualDone: true },
    },
    pending: { kind: "settled", note: "Fortsätter…" },
  };
}

/** Kvittot: exakt vad som efterfrågats, av vem, och med vilken motivering. */
export function receipts(request: RemovalRequest): readonly FieldRequestRecord[] {
  return request.vault.receipts();
}

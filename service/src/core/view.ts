import { requireProvider } from "./registry";
import { pendingFields, type PendingFieldView } from "./service";
import type { RemovalRequest } from "./store";
import type { RemovalStatus } from "./types";

/** Vad klienten får se. Innehåller aldrig ifyllda värden — bara vad som saknas och varför. */
export interface RequestView {
  id: string;
  createdAt: string;
  providers: ProviderView[];
  pendingFields: PendingFieldView[];
  receipts: { fieldId: string; providerName: string; reason: string }[];
  summary: { total: number; done: number; waiting: number; manual: number };
}

export interface ProviderView {
  id: string;
  name: string;
  url: string;
  summary: string;
  authenticationMethod: string;
  validForDays: number | null;
  /** Kan den osynliga webbläsaren köra tjänstens flöde, eller görs steget för hand? */
  automated: boolean;
  status: RemovalStatus;
  statusLabel: string;
  pending:
    | { kind: "need_information"; fieldIds: string[]; note?: string }
    | { kind: "need_user_action"; actionType: string; label: string; url?: string; note: string }
    | { kind: "manual"; url: string; instructions: string[]; note: string }
    | { kind: "settled"; note: string };
}

/**
 * Vanlig svenska, inga tekniska termer. Användaren ska inte behöva veta vad BankID,
 * ett formulär eller ett manuellt steg är för att förstå var hennes begäran ligger.
 */
const STATUS_LABEL: Record<RemovalStatus, string> = {
  NOT_STARTED: "Inte påbörjad",
  READY: "Redo",
  AUTHENTICATION_REQUIRED: "Väntar på dig",
  IN_PROGRESS: "Pågår",
  WAITING_FOR_USER: "Väntar på dig",
  SUBMITTED: "Begäran skickad",
  CONFIRMED: "Klart",
  FAILED: "Gick inte",
  MANUAL_ACTION_REQUIRED: "Behöver din hjälp",
};

export function toView(request: RemovalRequest): RequestView {
  const providers: ProviderView[] = request.providerIds.map((pid) => {
    const provider = requireProvider(pid);
    const run = request.runs[pid];
    const status: RemovalStatus = run?.context.status ?? "NOT_STARTED";
    const pending = run?.pending ?? { kind: "settled" as const, note: "" };

    return {
      id: provider.id,
      name: provider.name,
      url: provider.url,
      summary: provider.summary,
      authenticationMethod: provider.authenticationMethod,
      validForDays: provider.validForDays,
      automated: Boolean(provider.automation),
      status,
      statusLabel: STATUS_LABEL[status],
      pending:
        pending.kind === "need_information"
          ? {
              kind: "need_information",
              fieldIds: pending.fields.map((f) => f.id),
              ...(pending.note ? { note: pending.note } : {}),
            }
          : pending.kind === "need_user_action"
            ? {
                kind: "need_user_action",
                actionType: pending.action.type,
                label: pending.action.label,
                ...(pending.action.url ? { url: pending.action.url } : {}),
                note: pending.note,
              }
            : pending.kind === "manual"
              ? {
                  kind: "manual",
                  url: pending.url,
                  instructions: [...pending.instructions],
                  note: pending.note,
                }
              : { kind: "settled", note: pending.note },
    };
  });

  const done = providers.filter((p) => p.status === "SUBMITTED" || p.status === "CONFIRMED").length;
  const manual = providers.filter((p) => p.status === "MANUAL_ACTION_REQUIRED").length;
  const waiting = providers.length - done - manual;

  return {
    id: request.id,
    createdAt: request.createdAt,
    providers,
    pendingFields: pendingFields(request),
    receipts: request.vault.receipts().map((r) => ({
      fieldId: r.fieldId,
      providerName: requireProvider(r.providerId).name,
      reason: r.reason,
    })),
    summary: { total: providers.length, done, waiting, manual },
  };
}

import type { AutomationDescriptor } from "@/automation/config";
import type { FieldDefinition, FieldId } from "./fields";

export type AuthenticationMethod =
  | "NONE"
  | "FORM"
  | "EMAIL"
  | "BANKID"
  | "MANUAL"
  | "BROWSER_AUTOMATION";

export type RemovalStatus =
  | "NOT_STARTED"
  | "READY"
  | "AUTHENTICATION_REQUIRED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "SUBMITTED"
  | "CONFIRMED"
  | "FAILED"
  | "MANUAL_ACTION_REQUIRED";

/** Statusar där flödet är slut och inget mer kommer att hända av sig självt. */
export const TERMINAL_STATUSES: readonly RemovalStatus[] = ["CONFIRMED", "FAILED"];

/**
 * Allt en provider får se när den ombeds ta nästa steg.
 *
 * `collected` innehåller *bara* uppgifter som just den providern har deklarerat via
 * getRequiredInformation(). Motorn projicerar bort resten innan anropet — en tjänst
 * ska aldrig kunna läsa en uppgift den inte bett om, även om användaren har lämnat
 * den till någon annan tjänst i samma körning.
 */
export interface RemovalContext {
  readonly providerId: string;
  readonly status: RemovalStatus;
  readonly collected: Readonly<Partial<Record<FieldId, string>>>;
  /** Providerns eget arbetsminne mellan steg. Får aldrig innehålla personuppgifter. */
  readonly providerState: Readonly<Record<string, unknown>>;
  readonly attempt: number;
  readonly lastError?: string;
}

export interface UserAction {
  readonly type: "BANKID" | "OPEN_URL" | "CONFIRM";
  readonly label: string;
  readonly url?: string;
}

/**
 * Utfallet av ett enskilt steg. `need_information` är poängen med hela konstruktionen:
 * en provider får upptäcka mitt i flödet att den behöver något mer, och flödet pausar
 * där i stället för att ha frågat i förväg.
 */
export type RemovalStep =
  | {
      kind: "continue";
      status?: RemovalStatus;
      providerState?: Record<string, unknown>;
      note?: string;
    }
  | {
      kind: "need_information";
      fields: readonly FieldDefinition[];
      providerState?: Record<string, unknown>;
      note?: string;
    }
  | { kind: "need_user_action"; action: UserAction; note: string; providerState?: Record<string, unknown> }
  | { kind: "manual"; url: string; instructions: readonly string[]; note: string }
  | { kind: "submitted"; note: string }
  | { kind: "confirmed"; note: string }
  | { kind: "failed"; note: string };

export interface RemovalProvider {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly authenticationMethod: AuthenticationMethod;
  /** En rad om vad spärren faktiskt åstadkommer hos den här tjänsten. */
  readonly summary: string;
  /** Hur länge spärren gäller, i dagar. null = tjänsten anger det inte publikt. */
  readonly validForDays: number | null;

  /**
   * Hur den osynliga webbläsaren ska köra tjänstens flöde. Saknas den görs steget
   * för hand av användaren.
   */
  readonly automation?: AutomationDescriptor;

  /**
   * Vilka uppgifter tjänsten behöver *vid den här punkten i flödet*.
   *
   * Anropas om före varje steg. Svaret får ändras när providerState ändras — det är
   * så ett fält kan dyka upp mitt i processen. Returnera kumulativt: allt providern
   * behöver nu, inklusive det den redan fått, så att motorn vet vad den får läsa.
   */
  getRequiredInformation(context: RemovalContext): readonly FieldDefinition[];

  advance(context: RemovalContext): Promise<RemovalStep>;

  requiresUserInteraction(): boolean;
}

/** Kvitto på varje gång en uppgift efterfrågats, och med vilken motivering. */
export interface FieldRequestRecord {
  readonly providerId: string;
  readonly fieldId: FieldId;
  readonly reason: string;
  readonly at: string;
}

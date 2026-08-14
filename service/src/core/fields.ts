/**
 * Hela vokabulären av personuppgifter som tjänsten över huvud taget kan fråga efter.
 *
 * Listan är avsiktligt kort och avsiktligt sluten. Att lägga till en post här är ett
 * beslut som ska gå att försvara: varje rad är en uppgift som någon till slut måste
 * lämna ifrån sig. Finns det ingen provider som kräver fältet ska det inte finnas.
 */
export const FIELD_IDS = [
  "firstName",
  "lastName",
  "previousName",
  "personalNumber",
  "street",
  "postalCode",
  "city",
  "phone",
  "email",
  "profileUrl",
] as const;

export type FieldId = (typeof FIELD_IDS)[number];

export type InputType = "text" | "tel" | "email" | "url";

/**
 * En uppgift en provider begär — vid en bestämd punkt i sitt flöde, inte i förväg.
 *
 * `reason` är obligatoriskt med flit. Går det inte att skriva en mening om varför
 * just den här tjänsten behöver just den här uppgiften just nu, så är svaret att
 * inte fråga. Typsystemet gör den regeln omöjlig att glömma: UI:t kan alltid
 * rendera ett skäl, eftersom det aldrig kan saknas.
 */
export interface FieldDefinition {
  readonly id: FieldId;
  readonly label: string;
  readonly inputType: InputType;
  /** Klartext på svenska, visas för användaren i samma ögonblick som fältet dyker upp. */
  readonly reason: string;
  readonly placeholder?: string;
  readonly autoComplete?: string;
  readonly optional?: boolean;
}

/** Fältvisning som inte varierar mellan tjänster. Skälet gör det — det bor hos providern. */
const PRESENTATION: Record<
  FieldId,
  { label: string; inputType: InputType; placeholder?: string; autoComplete?: string }
> = {
  firstName: { label: "Förnamn", inputType: "text", autoComplete: "given-name" },
  lastName: { label: "Efternamn", inputType: "text", autoComplete: "family-name" },
  previousName: { label: "Tidigare efternamn", inputType: "text" },
  personalNumber: { label: "Personnummer", inputType: "text", placeholder: "ÅÅÅÅMMDD-XXXX" },
  street: { label: "Gatuadress", inputType: "text", autoComplete: "street-address" },
  postalCode: { label: "Postnummer", inputType: "text", autoComplete: "postal-code" },
  city: { label: "Ort", inputType: "text", autoComplete: "address-level2" },
  phone: { label: "Telefonnummer", inputType: "tel", autoComplete: "tel" },
  email: { label: "E-postadress", inputType: "email", autoComplete: "email" },
  profileUrl: {
    label: "Länk till din sida hos tjänsten",
    inputType: "url",
    placeholder: "https://…",
  },
};

/**
 * Bygger en fältdefinition. Skälet måste anges av anroparen — det är providerns ansvar,
 * inte katalogens, eftersom samma uppgift kan behövas av olika skäl hos olika tjänster.
 */
export function field(
  id: FieldId,
  reason: string,
  extra?: { optional?: boolean; label?: string },
): FieldDefinition {
  const base = PRESENTATION[id];
  if (!reason.trim()) {
    throw new Error(
      `Fältet "${id}" begärdes utan skäl. Varje efterfrågad uppgift måste kunna motiveras för användaren.`,
    );
  }
  return {
    id,
    label: extra?.label ?? base.label,
    inputType: base.inputType,
    reason,
    ...(base.placeholder ? { placeholder: base.placeholder } : {}),
    ...(base.autoComplete ? { autoComplete: base.autoComplete } : {}),
    ...(extra?.optional ? { optional: true } : {}),
  };
}

export function isFieldId(value: string): value is FieldId {
  return (FIELD_IDS as readonly string[]).includes(value);
}

/** Enkel formatkontroll. Returnerar felmeddelande på svenska, eller null om värdet duger. */
export function validate(id: FieldId, raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Fältet är tomt.";

  switch (id) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Det ser inte ut som en e-postadress.";
    case "phone":
      return /^[+\d][\d\s-]{6,}$/.test(value) ? null : "Det ser inte ut som ett telefonnummer.";
    case "postalCode":
      return /^\d{3}\s?\d{2}$/.test(value) ? null : "Postnummer skrivs som fem siffror.";
    case "profileUrl":
      try {
        const u = new URL(value);
        return u.protocol === "https:" || u.protocol === "http:" ? null : "Länken måste börja med https://";
      } catch {
        return "Det ser inte ut som en länk.";
      }
    case "personalNumber":
      return /^(\d{8}|\d{6})[-\s]?\d{4}$/.test(value) ? null : "Personnummer skrivs som ÅÅÅÅMMDD-XXXX.";
    default:
      return value.length >= 1 ? null : "Fältet är tomt.";
  }
}

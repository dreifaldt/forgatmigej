import { describe, expect, it } from "vitest";
import { emptyContext, runUntilBlocked, scopeContextToProvider } from "./engine";
import { field } from "./fields";
import type { RemovalContext, RemovalProvider, RemovalStep } from "./types";
import { Vault } from "./vault";
import { ratsit } from "@/providers/ratsit";
import { upplysning } from "@/providers/upplysning";

describe("progressiv uppgiftsinsamling", () => {
  it("frågar inte efter något innan en tjänst har sagt att den behöver det", async () => {
    // Ratsit kräver BankID och inget annat. Ett förhandsformulär hade frågat efter
    // personnummer, adress, telefon och e-post. Rätt svar är noll fält.
    const result = await runUntilBlocked(ratsit, emptyContext("ratsit"));

    expect(ratsit.getRequiredInformation(emptyContext("ratsit"))).toHaveLength(0);
    expect(result.requested).toHaveLength(0);
    expect(result.pending.kind).toBe("need_user_action");
    if (result.pending.kind === "need_user_action") {
      expect(result.pending.action.type).toBe("BANKID");
    }
  });

  it("efterfrågar aldrig personnummer för någon av de implementerade tjänsterna", async () => {
    for (const provider of [ratsit, upplysning]) {
      const asked = provider.getRequiredInformation(emptyContext(provider.id)).map((f) => f.id);
      expect(asked).not.toContain("personalNumber");
      expect(asked).not.toContain("street");
      expect(asked).not.toContain("previousName");
    }
  });

  it("kräver fler uppgifter mitt i flödet när tjänsten upptäcker att den behöver dem", async () => {
    // Steg 1: Upplysning ber om namn och e-post. Ingen profillänk i sikte.
    const first = await runUntilBlocked(upplysning, emptyContext("upplysning"));
    expect(first.pending.kind).toBe("need_information");
    const firstAsk =
      first.pending.kind === "need_information" ? first.pending.fields.map((f) => f.id) : [];
    expect(firstAsk).toEqual(["firstName", "lastName", "email"]);
    expect(firstAsk).not.toContain("profileUrl");

    // Steg 2: namnet visar sig tvetydigt — nu, och först nu, behövs profillänken.
    const answered: RemovalContext = {
      ...first.context,
      collected: { firstName: "Erik", lastName: "Andersson", email: "erik@example.se" },
    };
    const second = await runUntilBlocked(upplysning, answered);

    expect(second.pending.kind).toBe("need_information");
    if (second.pending.kind === "need_information") {
      expect(second.pending.fields.map((f) => f.id)).toEqual(["profileUrl"]);
      // Och användaren får veta varför den dök upp.
      expect(second.pending.fields[0]?.reason).toContain("flera profiler");
    }
  });

  it("går rakt igenom när namnet är entydigt — profillänken efterfrågas aldrig", async () => {
    const answered: RemovalContext = {
      ...emptyContext("upplysning"),
      collected: { firstName: "Erik", lastName: "Dreifaldt", email: "erik@example.se" },
    };
    const result = await runUntilBlocked(upplysning, answered);

    expect(result.pending.kind).toBe("settled");
    expect(result.context.status).toBe("SUBMITTED");
    expect(result.requested.map((r) => r.fieldId)).not.toContain("profileUrl");
  });

  it("varje efterfrågad uppgift bär ett skäl som går att visa", async () => {
    const result = await runUntilBlocked(upplysning, emptyContext("upplysning"));
    if (result.pending.kind !== "need_information") throw new Error("förväntade en fråga");
    for (const f of result.pending.fields) {
      expect(f.reason.length).toBeGreaterThan(20);
    }
    for (const rec of result.requested) {
      expect(rec.reason).toBeTruthy();
      expect(rec.providerId).toBe("upplysning");
    }
  });
});

describe("dataminimering", () => {
  it("en tjänst kan inte läsa uppgifter den inte har deklarerat", () => {
    // Användaren har lämnat e-post och namn till Upplysning.se i samma körning.
    const shared: RemovalContext = {
      ...emptyContext("ratsit"),
      collected: {
        firstName: "Erik",
        lastName: "Dreifaldt",
        email: "erik@example.se",
        phone: "070-1234567",
      },
    };

    // Ratsit deklarerar inga fält, alltså ser Ratsit inga fält.
    const scoped = scopeContextToProvider(ratsit, shared);
    expect(Object.keys(scoped.collected)).toHaveLength(0);

    // Upplysning deklarerar namn och e-post — men inte telefon.
    const scopedUpplysning = scopeContextToProvider(upplysning, { ...shared, providerId: "upplysning" });
    expect(Object.keys(scopedUpplysning.collected).sort()).toEqual(["email", "firstName", "lastName"]);
    expect(scopedUpplysning.collected.phone).toBeUndefined();
  });

  it("valvet vägrar lagra en uppgift som ingen tjänst har bett om", () => {
    const vault = new Vault();
    expect(() => vault.set("personalNumber", "19900101-1234")).toThrow(/inte efterfrågats/);

    vault.markRequested([
      { providerId: "upplysning", fieldId: "email", reason: "avsändare", at: "nu" },
    ]);
    expect(() => vault.set("email", "erik@example.se")).not.toThrow();
    expect(vault.get("email")).toBe("erik@example.se");
    expect(vault.get("personalNumber")).toBeUndefined();
  });

  it("valvet raderas och går inte att återanvända", () => {
    const vault = new Vault();
    vault.markRequested([{ providerId: "x", fieldId: "email", reason: "r", at: "nu" }]);
    vault.set("email", "erik@example.se");

    vault.scrub();

    expect(vault.get("email")).toBeUndefined();
    expect(vault.isScrubbed).toBe(true);
    expect(() => vault.markRequested([])).toThrow(/raderat/);
  });

  it("ett fält kan inte definieras utan motivering", () => {
    expect(() => field("phone", "  ")).toThrow(/utan skäl/);
  });
});

describe("motorns robusthet", () => {
  it("ett fel i en provider fäller inte hela körningen", async () => {
    const broken: RemovalProvider = {
      id: "broken",
      name: "Trasig",
      url: "https://example.se",
      authenticationMethod: "NONE",
      summary: "",
      validForDays: null,
      getRequiredInformation: () => [],
      advance: async (): Promise<RemovalStep> => {
        throw new Error("sajten svarade 500");
      },
      requiresUserInteraction: () => false,
    };

    const result = await runUntilBlocked(broken, emptyContext("broken"));
    expect(result.context.status).toBe("FAILED");
    expect(result.context.lastError).toContain("500");
  });

  it("frågar om deklarationen på nytt före varje steg", async () => {
    const calls: number[] = [];
    let step = 0;

    const counting: RemovalProvider = {
      id: "counting",
      name: "Räknare",
      url: "https://example.se",
      authenticationMethod: "NONE",
      summary: "",
      validForDays: null,
      getRequiredInformation: () => {
        calls.push(step);
        return [];
      },
      advance: async (): Promise<RemovalStep> => {
        step += 1;
        return step < 3 ? { kind: "continue" } : { kind: "confirmed", note: "klart" };
      },
      requiresUserInteraction: () => false,
    };

    await runUntilBlocked(counting, emptyContext("counting"));

    // Ett anrop före varje steg (plus projiceringen inför samma steg).
    expect(new Set(calls).size).toBe(3);
    expect(calls.length).toBeGreaterThanOrEqual(3);
  });
});

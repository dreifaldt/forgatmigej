import { describe, expect, it } from "vitest";
import { advanceAll, applyAnswers, confirmUserAction, pendingFields } from "./service";
import { store } from "./store";
import { toView } from "./view";

/**
 * Tester på hela kedjan: registret, motorn, valvet och vyn tillsammans.
 * De handlar mindre om kod och mer om löften — vad tjänsten frågar efter, när,
 * och vad den vägrar ta emot.
 */
describe("hela flödet", () => {
  it("frågar bara efter det de valda tjänsterna faktiskt behöver", async () => {
    const request = store.create(["ratsit", "upplysning", "mrkoll"]);
    await advanceAll(request);

    const asked = pendingFields(request).map((f) => f.id).sort();
    expect(asked).toEqual(["email", "firstName", "lastName", "postalCode"]);

    // Inget av det förbjudna, trots att tre tjänster är valda.
    expect(asked).not.toContain("personalNumber");
    expect(asked).not.toContain("street");
    expect(asked).not.toContain("city");
    expect(asked).not.toContain("phone");
    expect(asked).not.toContain("previousName");
  });

  it("Ratsit bidrar med noll fält till frågan", async () => {
    const onlyRatsit = store.create(["ratsit"]);
    await advanceAll(onlyRatsit);
    expect(pendingFields(onlyRatsit)).toHaveLength(0);

    const view = toView(onlyRatsit);
    expect(view.providers[0]?.status).toBe("AUTHENTICATION_REQUIRED");
  });

  it("vägrar ta emot en uppgift ingen har frågat efter", async () => {
    const request = store.create(["ratsit"]);
    await advanceAll(request);

    const { accepted, rejected } = applyAnswers(request, {
      personalNumber: "19900101-1234",
      phone: "070-1234567",
    });

    expect(accepted).toHaveLength(0);
    expect(rejected.map((r) => r.id).sort()).toEqual(["personalNumber", "phone"]);
    expect(rejected[0]?.problem).toMatch(/inte efterfrågats/);
  });

  it("samma uppgift frågas en gång men redovisar alla skäl", async () => {
    const request = store.create(["upplysning", "mrkoll"]);
    await advanceAll(request);

    const firstName = pendingFields(request).find((f) => f.id === "firstName");
    expect(firstName).toBeDefined();
    // Båda tjänsterna vill ha namnet, av olika skäl — och båda redovisas.
    expect(firstName?.reasons.map((r) => r.providerName).sort()).toEqual(["MrKoll", "Upplysning.se"]);
    expect(new Set(firstName?.reasons.map((r) => r.reason)).size).toBe(2);
  });

  it("tar användaren hela vägen till skickad begäran hos Ratsit", async () => {
    const request = store.create(["ratsit"]);
    await advanceAll(request);
    expect(toView(request).providers[0]?.status).toBe("AUTHENTICATION_REQUIRED");

    confirmUserAction(request, "ratsit");
    await advanceAll(request);

    const view = toView(request);
    expect(view.providers[0]?.status).toBe("SUBMITTED");
    expect(view.summary.done).toBe(1);
    // Och inte en enda uppgift lämnades ifrån sig på vägen.
    expect(view.receipts).toHaveLength(0);
  });

  it("är inte klar förrän varje vald tjänst har fått sin begäran", async () => {
    const request = store.create(["ratsit", "hitta"]);
    await advanceAll(request);
    expect(toView(request).complete).toBe(false);

    // En av två klar räcker inte — slutskärmen skulle ljuga.
    confirmUserAction(request, "ratsit");
    await advanceAll(request);
    expect(toView(request).summary.done).toBe(1);
    expect(toView(request).complete).toBe(false);

    confirmUserAction(request, "hitta");
    await advanceAll(request);
    const view = toView(request);
    expect(view.summary.done).toBe(2);
    expect(view.complete).toBe(true);
  });

  it("raderar allt när begäran tas bort", async () => {
    const request = store.create(["upplysning"]);
    await advanceAll(request);
    applyAnswers(request, { firstName: "Erik", lastName: "Dreifaldt", email: "erik@example.se" });
    expect(request.vault.get("email")).toBe("erik@example.se");

    store.delete(request.id);

    expect(store.get(request.id)).toBeUndefined();
    expect(request.vault.isScrubbed).toBe(true);
    expect(request.vault.get("email")).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { debtsOf, nextReminderAt, REMINDER_COOLDOWN_MS } from "./debts.js";

// Almuerzo de 120 pagado por Paul, entre Paul, Ana y Kevin (40 c/u).
const almuerzo = {
  id: "g1",
  memberIds: ["paul", "ana", "kevin"],
  expenses: [
    {
      pagadoPorId: "paul",
      montoCentavos: 12000,
      items: [
        { usuarioId: "paul", montoCentavos: 4000 },
        { usuarioId: "ana", montoCentavos: 4000 },
        { usuarioId: "kevin", montoCentavos: 4000 },
      ],
    },
  ],
  payments: [],
};

describe("debtsOf (UX-06)", () => {
  it("quien pagó ve a quién le deben", () => {
    const { owe, owedToMe } = debtsOf("paul", [almuerzo]);
    expect(owe).toEqual([]);
    expect(owedToMe).toHaveLength(2);
    expect(owedToMe.every((d) => d.cents === 4000 && d.groupId === "g1")).toBe(true);
  });

  it("quien debe ve a quién le debe y cuánto", () => {
    expect(debtsOf("ana", [almuerzo])).toEqual({ owe: [{ groupId: "g1", userId: "paul", cents: 4000 }], owedToMe: [] });
  });

  it("un pago confirmado salda la deuda", () => {
    const pagado = { ...almuerzo, payments: [{ deudorId: "ana", acreedorId: "paul", montoCentavos: 4000 }] };
    expect(debtsOf("ana", [pagado]).owe).toEqual([]);
  });

  it("junta varios grupos y ordena de mayor a menor", () => {
    const otro = {
      id: "g2",
      memberIds: ["ana", "kevin"],
      expenses: [{ pagadoPorId: "kevin", montoCentavos: 10000, items: [{ usuarioId: "ana", montoCentavos: 10000 }] }],
      payments: [],
    };
    expect(debtsOf("ana", [almuerzo, otro]).owe.map((d) => [d.groupId, d.cents])).toEqual([
      ["g2", 10000],
      ["g1", 4000],
    ]);
  });

  it("alguien ajeno al grupo no tiene deudas ahí", () => {
    expect(debtsOf("intruso", [almuerzo])).toEqual({ owe: [], owedToMe: [] });
  });
});

describe("nextReminderAt (UX-08)", () => {
  const now = new Date("2026-11-11T12:00:00Z");

  it("sin recordatorio previo se puede enviar", () => {
    expect(nextReminderAt(null, now)).toBeNull();
  });

  it("antes de 24 h está bloqueado hasta las 24 h", () => {
    const last = new Date(now.getTime() - 60 * 60 * 1000);
    expect(nextReminderAt(last, now)).toEqual(new Date(last.getTime() + REMINDER_COOLDOWN_MS));
  });

  it("después de 24 h se puede volver a enviar", () => {
    expect(nextReminderAt(new Date(now.getTime() - REMINDER_COOLDOWN_MS - 1), now)).toBeNull();
  });
});

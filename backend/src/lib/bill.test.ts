import { describe, expect, it } from "vitest";
import { BillError, computeBill, type BillLine } from "./bill.js";

const line = (
  description: string,
  quantity: number,
  unitPrice: number,
  assignments: [string, number][] = [],
  shared = false,
): BillLine => ({
  description,
  quantity,
  unitPriceCents: Math.round(unitPrice * 100),
  shared,
  assignments: assignments.map(([userId, q]) => ({ userId, quantity: q })),
});

const people = ["josue", "alexis", "picon"];

describe("computeBill — ejemplo del almuerzo del sábado", () => {
  // 2 churrascos de 25, 1 churrasco de 15, 4 bebidas de 5 = 85
  const lines = (assign: boolean) => [
    line("Churrasco 25", 2, 25, assign ? [["josue", 1], ["alexis", 1]] : []),
    line("Churrasco 15", 1, 15, assign ? [["picon", 1]] : []),
    line("Bebida", 4, 5, assign ? [["josue", 1], ["alexis", 2], ["picon", 1]] : []),
  ];

  it("partes iguales: 85 entre 3", () => {
    const r = computeBill({ splitType: "equal", participantIds: people, lines: lines(false) });
    expect(r.totalCents).toBe(8500);
    expect(r.shares.map((s) => s.cents)).toEqual([2834, 2833, 2833]);
  });

  it("por ítems: Josue 30, Alexis 35, Picon 20", () => {
    const r = computeBill({ splitType: "items", participantIds: people, lines: lines(true) });
    expect(r.totalCents).toBe(8500);
    expect(r.shares).toEqual([
      { userId: "josue", cents: 3000 },
      { userId: "alexis", cents: 3500 },
      { userId: "picon", cents: 2000 },
    ]);
  });
});

describe("computeBill — por ítems", () => {
  it("una línea compartida se divide entre quienes la consumieron", () => {
    const r = computeBill({
      splitType: "items",
      participantIds: people,
      lines: [line("Pizza", 1, 100, [["josue", 1], ["alexis", 1], ["picon", 1]], true)],
    });
    expect(r.shares.map((s) => s.cents)).toEqual([3334, 3333, 3333]);
  });

  it("rechaza unidades sin asignar", () => {
    expect(() =>
      computeBill({ splitType: "items", participantIds: people, lines: [line("Bebida", 4, 5, [["josue", 3]])] }),
    ).toThrow(/Faltan 1 de 4 unidades/);
  });

  it("rechaza asignar más unidades de las que hay", () => {
    expect(() =>
      computeBill({ splitType: "items", participantIds: people, lines: [line("Bebida", 2, 5, [["josue", 3]])] }),
    ).toThrow(/solo hay 2/);
  });

  it("rechaza asignar a alguien que no participa", () => {
    expect(() =>
      computeBill({ splitType: "items", participantIds: ["josue"], lines: [line("Bebida", 1, 5, [["intruso", 1]])] }),
    ).toThrow(BillError);
  });

  it("quien no consumió nada no aparece en las partes", () => {
    const r = computeBill({ splitType: "items", participantIds: people, lines: [line("Café", 1, 10, [["picon", 1]])] });
    expect(r.shares).toEqual([{ userId: "picon", cents: 1000 }]);
  });
});

describe("computeBill — total", () => {
  it("sin ítems usa el monto total", () => {
    const r = computeBill({ splitType: "equal", participantIds: ["a", "b"], lines: [], amountCents: 5000 });
    expect(r.shares.map((s) => s.cents)).toEqual([2500, 2500]);
  });

  it("exige ítems o monto", () => {
    expect(() => computeBill({ splitType: "equal", participantIds: ["a"], lines: [] })).toThrow(/monto total/);
  });

  it("rechaza un total distinto a la suma de los ítems", () => {
    expect(() =>
      computeBill({ splitType: "equal", participantIds: ["a"], lines: [line("x", 1, 10)], amountCents: 900 }),
    ).toThrow(/no coincide/);
  });

  it("rechaza un total mayor a 1,000,000", () => {
    expect(() =>
      computeBill({ splitType: "equal", participantIds: ["a"], lines: [line("x", 2, 600000)] }),
    ).toThrow(/no puede ser mayor/);
  });
});

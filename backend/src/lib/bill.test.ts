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

describe("computeBill — propina (UX-05)", () => {
  it("10 % sobre partes iguales: 120 entre 4 => subtotal 120, propina 12, 33 c/u", () => {
    const r = computeBill({ splitType: "equal", participantIds: ["a", "b", "c", "d"], amountCents: 12000, lines: [], tipPercent: 10 });
    expect(r.subtotalCents).toBe(12000);
    expect(r.tipCents).toBe(1200);
    expect(r.totalCents).toBe(13200);
    expect(r.shares.map((s) => s.cents)).toEqual([3300, 3300, 3300, 3300]);
  });

  it("la propina se reparte en proporción a lo consumido", () => {
    const r = computeBill({
      splitType: "items",
      participantIds: people,
      lines: [line("Churrasco", 1, 50, [["josue", 1]]), line("Pizza", 1, 30, [["alexis", 1]]), line("Sopa", 1, 20, [["picon", 1]])],
      tipPercent: 10,
    });
    expect(r.tipCents).toBe(1000);
    expect(r.shares).toEqual([
      { userId: "josue", cents: 5500 },
      { userId: "alexis", cents: 3300 },
      { userId: "picon", cents: 2200 },
    ]);
  });

  it("los centavos de la propina no se pierden ni sobran", () => {
    const r = computeBill({ splitType: "equal", participantIds: people, amountCents: 10000, lines: [], tipPercent: 7 });
    expect(r.tipCents).toBe(700);
    expect(r.shares.reduce((sum, s) => sum + s.cents, 0)).toBe(r.totalCents);
  });

  it("montos exactos + propina: los montos deben sumar el subtotal", () => {
    const r = computeBill({
      splitType: "itemized",
      participantIds: ["a", "b"],
      amountCents: 10000,
      lines: [],
      manualShares: [
        { userId: "a", cents: 6000 },
        { userId: "b", cents: 4000 },
      ],
      tipPercent: 10,
    });
    expect(r.totalCents).toBe(11000);
    expect(r.shares).toEqual([
      { userId: "a", cents: 6600 },
      { userId: "b", cents: 4400 },
    ]);
  });

  it("sin propina el resultado no cambia", () => {
    const r = computeBill({ splitType: "equal", participantIds: ["a", "b"], amountCents: 1000, lines: [] });
    expect(r.tipCents).toBe(0);
    expect(r.totalCents).toBe(1000);
  });

  it.each([-1, 31, 10.5])("rechaza una propina de %s %%", (tipPercent) => {
    expect(() =>
      computeBill({ splitType: "equal", participantIds: ["a"], amountCents: 1000, lines: [], tipPercent }),
    ).toThrow(BillError);
  });
});

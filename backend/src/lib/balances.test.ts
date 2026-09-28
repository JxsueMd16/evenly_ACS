import { describe, expect, it } from "vitest";
import { computeNetCents, suggestSettlements, type ExpenseForBalance } from "./balances.js";
import { splitEqually } from "./money.js";

function equalExpense(payer: string, cents: number, members: string[]): ExpenseForBalance {
  return {
    pagadoPorId: payer,
    montoCentavos: cents,
    items: splitEqually(cents, members).map((s) => ({ usuarioId: s.userId, montoCentavos: s.cents })),
  };
}

describe("computeNetCents", () => {
  it("calcula el balance del grupo 'Viaje a la playa' del seed", () => {
    const members = ["paul", "ana", "kevin"];
    const net = computeNetCents(members, [
      equalExpense("paul", 24000, members),
      equalExpense("ana", 4500, members),
      equalExpense("kevin", 7800, members),
    ]);
    // Cada uno debe 121.00; Paul pagó 240, Ana 45, Kevin 78.
    expect(net.get("paul")).toBe(11900);
    expect(net.get("ana")).toBe(-7600);
    expect(net.get("kevin")).toBe(-4300);
  });

  it("la suma de todos los balances es 0", () => {
    const members = ["a", "b", "c"];
    const net = computeNetCents(members, [equalExpense("a", 10000, members), equalExpense("b", 3333, members)]);
    expect([...net.values()].reduce((s, v) => s + v, 0)).toBe(0);
  });

  it("incluye a integrantes sin gastos con balance 0", () => {
    const net = computeNetCents(["a", "b", "z"], [equalExpense("a", 1000, ["a", "b"])]);
    expect(net.get("z")).toBe(0);
  });
});

describe("computeNetCents con pagos confirmados", () => {
  it("un pago total deja a ambos en 0", () => {
    const members = ["a", "b"];
    const net = computeNetCents(members, [equalExpense("a", 1000, members)], [
      { deudorId: "b", acreedorId: "a", montoCentavos: 500 },
    ]);
    expect(net.get("a")).toBe(0);
    expect(net.get("b")).toBe(0);
  });

  it("un pago parcial reduce la deuda", () => {
    const members = ["a", "b"];
    const net = computeNetCents(members, [equalExpense("a", 1000, members)], [
      { deudorId: "b", acreedorId: "a", montoCentavos: 200 },
    ]);
    expect(net.get("b")).toBe(-300);
    expect(net.get("a")).toBe(300);
  });
});

describe("suggestSettlements", () => {
  it("salda el grupo con como máximo n-1 pagos", () => {
    const net = new Map([
      ["paul", 11900],
      ["ana", -7600],
      ["kevin", -4300],
    ]);
    const settlements = suggestSettlements(net);
    expect(settlements).toEqual([
      { fromUserId: "ana", toUserId: "paul", cents: 7600 },
      { fromUserId: "kevin", toUserId: "paul", cents: 4300 },
    ]);
  });

  it("no sugiere pagos si todos están al día", () => {
    expect(suggestSettlements(new Map([["a", 0], ["b", 0]]))).toEqual([]);
  });
});

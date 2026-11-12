import { describe, expect, it } from "vitest";
import { hasAtMostTwoDecimals, splitEqually, splitProportionally, toCents } from "./money.js";

describe("toCents", () => {
  it("convierte sin errores de punto flotante", () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(62.5)).toBe(6250);
    expect(toCents(1_000_000)).toBe(100_000_000);
  });
});

describe("hasAtMostTwoDecimals", () => {
  it.each([12, 12.5, 12.55, 0.01, 999999.99])("acepta %s", (n) => {
    expect(hasAtMostTwoDecimals(n)).toBe(true);
  });
  it.each([12.345, 0.001, 1.999])("rechaza %s", (n) => {
    expect(hasAtMostTwoDecimals(n)).toBe(false);
  });
});

describe("splitEqually", () => {
  it("reparte los centavos sobrantes para que la suma sea exacta (DEF-001)", () => {
    const shares = splitEqually(10000, ["a", "b", "c"]);
    expect(shares.map((s) => s.cents)).toEqual([3334, 3333, 3333]);
    expect(shares.reduce((sum, s) => sum + s.cents, 0)).toBe(10000);
  });

  it("divide exacto cuando no hay sobrante", () => {
    expect(splitEqually(24000, ["a", "b", "c"]).map((s) => s.cents)).toEqual([8000, 8000, 8000]);
  });

  it("maneja el monto mínimo entre más personas que centavos", () => {
    const shares = splitEqually(1, ["a", "b", "c"]);
    expect(shares.map((s) => s.cents)).toEqual([1, 0, 0]);
  });

  it("devuelve vacío sin participantes", () => {
    expect(splitEqually(100, [])).toEqual([]);
  });
});

describe("splitProportionally", () => {
  it("reparte en proporción exacta", () => {
    expect(
      splitProportionally(1000, [
        { userId: "a", cents: 5000 },
        { userId: "b", cents: 3000 },
        { userId: "c", cents: 2000 },
      ]).map((s) => s.cents),
    ).toEqual([500, 300, 200]);
  });

  it("la suma siempre es igual al total (mayor residuo)", () => {
    const parts = splitProportionally(100, [
      { userId: "a", cents: 1 },
      { userId: "b", cents: 1 },
      { userId: "c", cents: 1 },
    ]);
    expect(parts.map((s) => s.cents)).toEqual([34, 33, 33]);
  });

  it("con pesos en cero reparte en partes iguales", () => {
    expect(splitProportionally(10, [{ userId: "a", cents: 0 }, { userId: "b", cents: 0 }]).map((s) => s.cents)).toEqual([5, 5]);
  });
});

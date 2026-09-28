import { describe, expect, it } from "vitest";
import { hasAtMostTwoDecimals, splitEqually, toCents } from "./money.js";

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

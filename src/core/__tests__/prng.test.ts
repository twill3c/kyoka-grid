import { describe, expect, it } from "vitest";
import { randInt, rngInit, rngNext } from "@/core/prng";

// T-001 / T-002 / T-003(F-01)

describe("prng", () => {
  // T-001: 同一シードは同一列
  it("同一シードで同一の乱数列を生成し、値は [0,1)", () => {
    let a = rngInit(42);
    let b = rngInit(42);
    for (let i = 0; i < 100; i++) {
      const ra = rngNext(a);
      const rb = rngNext(b);
      expect(ra.value).toBe(rb.value);
      expect(ra.value).toBeGreaterThanOrEqual(0);
      expect(ra.value).toBeLessThan(1);
      a = ra.state;
      b = rb.state;
    }
  });

  // T-002: 異なるシードは異なる列
  it("異なるシードでは先頭 8 個の列が一致しない", () => {
    const seq = (seed: number): number[] => {
      let s = rngInit(seed);
      const out: number[] = [];
      for (let i = 0; i < 8; i++) {
        const r = rngNext(s);
        out.push(r.value);
        s = r.state;
      }
      return out;
    };
    expect(seq(1)).not.toEqual(seq(2));
  });

  // T-003: randInt は常に範囲内・両端が出現・整数
  it("randInt(0,3) を 200 回で範囲内・両端出現・整数", () => {
    let s = rngInit(7);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const r = randInt(s, 0, 3);
      expect(Number.isInteger(r.value)).toBe(true);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThanOrEqual(3);
      seen.add(r.value);
      s = r.state;
    }
    expect(seen.has(0)).toBe(true);
    expect(seen.has(3)).toBe(true);
  });
});

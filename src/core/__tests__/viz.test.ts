import { describe, expect, it } from "vitest";
import {
  HEAT_NEUTRAL,
  arrowOpacity,
  heatColor,
  pushTrail,
  stateValues,
} from "@/core/viz";

// T-070 〜 T-073(F-05)

describe("viz", () => {
  // T-070: V(s) = max_a Q(s,a)
  it("stateValues は各セルの max Q を返す", () => {
    const q = [
      [0, 1, -2, 0.5],
      [-3, -1, -2, -4],
    ];
    expect(stateValues(q)).toEqual([1, -1]);
  });

  // T-071: 発散配色(中立・単調・クランプ)
  it("heatColor は v=0 で中立、正負で各極へ単調に向かう", () => {
    const neutral = heatColor(0, 1, 100);
    expect(neutral).toBe(HEAT_NEUTRAL);
    expect(neutral).toMatch(/^#[0-9a-f]{6}$/);

    // 正の単調性: 青チャンネルの寄与が増える方向に変化し、すべて異なる色
    const pos = [0.1, 0.4, 0.7, 1.0].map((v) => heatColor(v, 1, 100));
    expect(new Set(pos).size).toBe(4);
    for (const c of pos) expect(c).toMatch(/^#[0-9a-f]{6}$/);

    const neg = [-1, -30, -100].map((v) => heatColor(v, 1, 100));
    expect(new Set(neg).size).toBe(3);

    // クランプ: 範囲超過は極の色と同じ
    expect(heatColor(2, 1, 100)).toBe(heatColor(1, 1, 100));
    expect(heatColor(-500, 1, 100)).toBe(heatColor(-100, 1, 100));

    // 正極と負極は異なる
    expect(heatColor(1, 1, 100)).not.toBe(heatColor(-100, 1, 100));
  });

  // T-072: 矢印の不透明度は Q 差に単調
  it("arrowOpacity は Q 差 0 で下限・差が大きいほど増加し 1 で飽和", () => {
    const flat = arrowOpacity([0, 0, 0, 0]);
    const small = arrowOpacity([0.1, 0, 0, 0]);
    const large = arrowOpacity([5, 0, 0, 0]);
    expect(flat).toBeGreaterThan(0);
    expect(flat).toBeLessThan(small);
    expect(small).toBeLessThan(large);
    expect(large).toBeLessThanOrEqual(1);
  });

  // T-073: 軌跡は直近 cap 点のみ・リセット可能
  it("pushTrail は cap を超えた古い点を捨てる", () => {
    let trail: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 10; i++) {
      trail = pushTrail(trail, { x: i, y: 0 }, 4);
    }
    expect(trail.length).toBe(4);
    expect(trail[0]).toEqual({ x: 6, y: 0 });
    expect(trail[3]).toEqual({ x: 9, y: 0 });
  });
});

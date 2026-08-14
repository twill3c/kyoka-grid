import { describe, expect, it } from "vitest";
import { curvePoints } from "@/core/viz";

// T-074(F-08): 学習曲線の SVG points 生成

describe("curvePoints", () => {
  it("値域を高さへ正規化し、x は等間隔", () => {
    const pts = curvePoints([0, 5, 10], 100, 50);
    const parsed = pts.split(" ").map((p) => p.split(",").map(Number));
    expect(parsed.length).toBe(3);
    // x: 0, 50, 100
    expect(parsed.map((p) => p[0])).toEqual([0, 50, 100]);
    // y: 最小値 0 → 高さ 50(下端)、最大値 10 → 0(上端)
    expect(parsed[0][1]).toBeCloseTo(50, 6);
    expect(parsed[1][1]).toBeCloseTo(25, 6);
    expect(parsed[2][1]).toBeCloseTo(0, 6);
  });

  it("空列は空文字・1 点と定数列は中央高さ", () => {
    expect(curvePoints([], 100, 50)).toBe("");
    const single = curvePoints([3], 100, 50);
    expect(single.split(" ").length).toBe(1);
    expect(Number(single.split(",")[1])).toBeCloseTo(25, 6);
    const flat = curvePoints([2, 2, 2], 100, 50)
      .split(" ")
      .map((p) => Number(p.split(",")[1]));
    for (const y of flat) expect(y).toBeCloseTo(25, 6);
  });
});

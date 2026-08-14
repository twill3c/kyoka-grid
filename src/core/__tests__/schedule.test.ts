import { describe, expect, it } from "vitest";
import { MAX_STEPS_PER_FRAME, SPEEDS, batchSize } from "@/core/schedule";

// T-060(N-03): 1 フレームの学習バッチに上限がある

describe("schedule", () => {
  it("全速度で 1 フレームのバッチが上限以下", () => {
    expect(SPEEDS).toEqual([1, 10, 100]);
    for (const s of SPEEDS) {
      expect(batchSize(s)).toBeGreaterThanOrEqual(1);
      expect(batchSize(s)).toBeLessThanOrEqual(MAX_STEPS_PER_FRAME);
    }
    // 1x は 1 ステップ/フレーム、100x は上限内で最大
    expect(batchSize(1)).toBe(1);
    expect(batchSize(100)).toBe(Math.min(100, MAX_STEPS_PER_FRAME));
  });
});

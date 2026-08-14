import { describe, expect, it } from "vitest";
import type { GridMap } from "@/core/types";
import { cellIndex, step, validateMap } from "@/core/gridworld";
import { MAPS, MAP_SIMPLE } from "@/core/maps";
import { bellmanResidual, solve } from "@/core/valueIteration";

const GAMMA = 0.95;

// T-020 用合成フィクスチャ: 1×4 の一本道コリドー
const corridor: GridMap = {
  id: "t-corridor",
  name: "テスト用 1×4 コリドー",
  width: 4,
  height: 1,
  start: { x: 0, y: 0 },
  goal: { x: 3, y: 0 },
  walls: [],
  traps: [],
  wind: [0, 0, 0, 0],
  stepReward: -0.04,
  goalReward: 1,
  trapPenalty: -100,
};

describe("valueIteration", () => {
  // T-020: 一本道の解析解と一致
  it("1×4 コリドーの V* が解析解と一致する", () => {
    // 期待値の導出: ゴールまでの距離 d のセルの最適挙動は「右へ d 回」。
    //   V*(d) = Σ_{k=0}^{d-1} γ^k·stepReward + γ^{d-1}·goalReward
    // (最後のステップで stepReward と goalReward が同時に入る)
    // 前提の検算: 一本道(高さ 1)・壁/罠/風なし・右以外の行動は静止して
    // stepReward を失うだけなので、最適行動は一意に「右」である。
    expect(corridor.height).toBe(1);
    expect(corridor.walls).toEqual([]);
    expect(corridor.traps).toEqual([]);
    expect(corridor.wind.every((w) => w === 0)).toBe(true);
    expect(validateMap(corridor).ok).toBe(true);

    const { v, policy } = solve(corridor, GAMMA);
    for (let x = 0; x < 3; x++) {
      const d = 3 - x;
      let expected = 0;
      for (let k = 0; k < d; k++) expected += Math.pow(GAMMA, k) * -0.04;
      expected += Math.pow(GAMMA, d - 1) * 1;
      expect(v[cellIndex(corridor, { x, y: 0 })]).toBeCloseTo(expected, 9);
      // 最適行動は一意に「右」(前提検算どおり)
      expect(policy[cellIndex(corridor, { x, y: 0 })]).toEqual([1]);
    }
  });

  // T-021 / G-03: 全内蔵マップで Bellman 残差 < 1e-9(独立再計算)
  it("全内蔵マップで Bellman 残差 < 1e-9", () => {
    for (const m of MAPS) {
      const { v } = solve(m, GAMMA);
      expect(bellmanResidual(m, GAMMA, v)).toBeLessThan(1e-9);
    }
  });

  // T-022: 単純迷路の π* を貪欲に辿ると最短ステップでゴール
  it("単純迷路の π* が最短経路でゴールへ導く", () => {
    const { policy } = solve(MAP_SIMPLE, GAMMA);
    let pos = MAP_SIMPLE.start;
    let steps = 0;
    const budget = MAP_SIMPLE.width * MAP_SIMPLE.height * 2;
    while (steps < budget) {
      const acts = policy[cellIndex(MAP_SIMPLE, pos)];
      expect(acts.length).toBeGreaterThan(0);
      const r = step(MAP_SIMPLE, pos, acts[0]);
      pos = r.next;
      steps++;
      if (r.done) break;
    }
    expect(pos).toEqual(MAP_SIMPLE.goal);
    // 最短性: BFS 距離と一致することを独立再計算で確認する
    // (γ<1 かつ一様ステップコストでは最適方策は最短経路)
    const dist = bfsDistance(MAP_SIMPLE);
    expect(steps).toBe(dist);
  });
});

/** テスト内独立再計算用の BFS 最短距離(壁のみ考慮・風なしマップ前提) */
function bfsDistance(m: GridMap): number {
  expect(m.wind.every((w) => w === 0)).toBe(true);
  expect(m.traps).toEqual([]);
  const wallSet = new Set(m.walls.map((c) => `${c.x},${c.y}`));
  const seen = new Map<string, number>([[`${m.start.x},${m.start.y}`, 0]]);
  const queue = [m.start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const d = seen.get(`${cur.x},${cur.y}`)!;
    if (cur.x === m.goal.x && cur.y === m.goal.y) return d;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= m.width || ny >= m.height) continue;
      if (wallSet.has(k) || seen.has(k)) continue;
      seen.set(k, d + 1);
      queue.push({ x: nx, y: ny });
    }
  }
  throw new Error("ゴール到達不能マップ(validateMap が落とすべき)");
}

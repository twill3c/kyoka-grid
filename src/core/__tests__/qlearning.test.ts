import { describe, expect, it } from "vitest";
import type { GridMap } from "@/core/types";
import { cellIndex } from "@/core/gridworld";
import {
  createTrainer,
  greedyAction,
  movingAverage,
  runEpisodes,
  trainerStep,
} from "@/core/qlearning";
import type { QParams } from "@/core/qlearning";

const P: QParams = {
  alpha: 0.5,
  gamma: 0.95,
  epsilon: 0.2,
  maxStepsPerEpisode: 200,
};

const open3x3: GridMap = {
  id: "t-open",
  name: "テスト用 3×3",
  width: 3,
  height: 3,
  start: { x: 0, y: 2 },
  goal: { x: 2, y: 0 },
  walls: [],
  traps: [],
  wind: [0, 0, 0],
  stepReward: -0.04,
  goalReward: 1,
  trapPenalty: -100,
};

describe("qlearning", () => {
  // T-030: 単一遷移の TD 更新が手計算と一致
  it("TD 更新 Q ← Q + α(r + γ·maxQ' − Q) が手計算と一致する", () => {
    // ε=0 で貪欲固定。初期 Q は全ゼロなので argmax タイは行動 0(上)。
    // 開始 (0,2) から上 → (0,1)、r=−0.04、maxQ'(全ゼロ)=0
    //   Q(s,0) ← 0 + 0.5·(−0.04 + 0.95·0 − 0) = −0.02
    const ts0 = createTrainer(open3x3, 1);
    const ts1 = trainerStep(open3x3, ts0, { ...P, epsilon: 0 });
    const s0 = cellIndex(open3x3, open3x3.start);
    expect(ts1.q[s0][0]).toBeCloseTo(-0.02, 12);
    expect(ts1.pos).toEqual({ x: 0, y: 1 });
    expect(ts1.lastUpdate).not.toBeNull();
    expect(ts1.lastUpdate!.state).toBe(s0);
    expect(ts1.lastUpdate!.action).toBe(0);
    // TD 誤差 = r + γmaxQ' − Q = −0.04
    expect(ts1.lastUpdate!.tdError).toBeCloseTo(-0.04, 12);
  });

  // T-031: ε=0 は argmax 固定・ε=1 は全行動が出現
  it("ε=0 で貪欲固定、ε=1 で全行動が出現する", () => {
    // 貪欲: Q を偏らせれば常にその行動
    let ts = createTrainer(open3x3, 3);
    const s0 = cellIndex(open3x3, open3x3.start);
    ts = { ...ts, q: ts.q.map((row, i) => (i === s0 ? [0, 5, 0, 0] : row)) };
    const r1 = trainerStep(open3x3, ts, { ...P, epsilon: 0 });
    expect(r1.lastUpdate!.action).toBe(1);

    // ε=1: 200 ステップで 4 行動すべてが選ばれる
    let cur = createTrainer(open3x3, 5);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      cur = trainerStep(open3x3, cur, { ...P, epsilon: 1 });
      seen.add(cur.lastUpdate!.action);
    }
    expect(seen.size).toBe(4);
  });

  // T-032 / G-04: 同一シードで 2 回学習した Q テーブルは深い等値
  it("同一シード・同一パラメータの 2 回の学習が同一の Q を生む", () => {
    const a = runEpisodes(open3x3, createTrainer(open3x3, 1), P, 50);
    const b = runEpisodes(open3x3, createTrainer(open3x3, 1), P, 50);
    expect(a.q).toEqual(b.q);
    expect(a.returns).toEqual(b.returns);
    expect(a.episode).toBe(50);
  });

  // T-033: 学習途中のパラメータ変更が次ステップから反映される
  it("α 変更が次ステップの更新幅に反映される", () => {
    const ts0 = createTrainer(open3x3, 1);
    const s0 = cellIndex(open3x3, open3x3.start);
    const half = trainerStep(open3x3, ts0, { ...P, epsilon: 0, alpha: 0.5 });
    const tenth = trainerStep(open3x3, ts0, { ...P, epsilon: 0, alpha: 0.1 });
    expect(half.q[s0][0]).toBeCloseTo(-0.02, 12);
    expect(tenth.q[s0][0]).toBeCloseTo(-0.004, 12);
  });

  // T-040: エピソードは maxStepsPerEpisode で必ず打ち切られる
  it("maxStepsPerEpisode で打ち切られ、returns に記録される", () => {
    // 3×3 でゴールまで最短 4 歩 → 上限 3 なら 3 ステップ目で必ず打ち切り
    let ts = createTrainer(open3x3, 1);
    const p = { ...P, epsilon: 0, maxStepsPerEpisode: 3 };
    for (let i = 0; i < 3; i++) {
      expect(ts.episode).toBe(0);
      ts = trainerStep(open3x3, ts, p);
    }
    expect(ts.episode).toBe(1);
    expect(ts.returns.length).toBe(1);
    expect(ts.stepsInEpisode).toBe(0);
    expect(ts.pos).toEqual(open3x3.start);
  });

  // T-051: 移動平均(窓 20)
  it("movingAverage は窓未満で逐次平均・以後は直近窓平均", () => {
    const xs = Array.from({ length: 25 }, (_, i) => i + 1); // 1..25
    const ma = movingAverage(xs, 20);
    expect(ma.length).toBe(25);
    expect(ma[0]).toBeCloseTo(1, 12);
    expect(ma[2]).toBeCloseTo(2, 12); // (1+2+3)/3
    // 25 番目: 直近 20 個 = 6..25 の平均 = 15.5
    expect(ma[24]).toBeCloseTo(15.5, 12);
  });

  // greedyAction のタイ規則(最小 index)
  it("greedyAction はタイ時に最小 index を返す", () => {
    expect(greedyAction([3, 3, 1, 3])).toBe(0);
    expect(greedyAction([0, 2, 2, 1])).toBe(1);
  });
});

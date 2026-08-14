import { describe, expect, it } from "vitest";
import { MAP_CLIFF, MAP_SIMPLE } from "@/core/maps";
import {
  createTrainer,
  evaluateGreedy,
  policyAgreement,
  runEpisodes,
} from "@/core/qlearning";
import { solve } from "@/core/valueIteration";
import type { GridMap } from "@/core/types";
import { cellIndex, step } from "@/core/gridworld";

const GAMMA = 0.95;

// T-050 用: 2×1 の極小マップ(開始→ゴール)
const tiny: GridMap = {
  id: "t-tiny",
  name: "テスト用 2×1",
  width: 2,
  height: 1,
  start: { x: 0, y: 0 },
  goal: { x: 1, y: 0 },
  walls: [],
  traps: [],
  wind: [0, 0],
  stepReward: -0.04,
  goalReward: 1,
  trapPenalty: -100,
};

describe("学習ゲート", () => {
  // T-050: 方策一致率の定義(分母=占有可能な非終端セル・タイは π* 集合所属)
  it("policyAgreement が全一致で 100%・既知の不一致で正しい割合を返す", () => {
    const { policy } = solve(tiny, GAMMA);
    // 非終端の占有可能セルは (0,0) の 1 個のみ
    // 右(1)が最適。Q で右を最大にすれば一致率 1
    const nStates = tiny.width * tiny.height;
    const qGood: number[][] = Array.from({ length: nStates }, () => [0, 1, 0, 0]);
    const good = policyAgreement(tiny, qGood, policy);
    expect(good.total).toBe(1);
    expect(good.agree).toBe(1);
    expect(good.ratio).toBe(1);
    // 左(3)を最大にすれば一致率 0
    const qBad: number[][] = Array.from({ length: nStates }, () => [0, 0, 0, 1]);
    expect(policyAgreement(tiny, qBad, policy).ratio).toBe(0);
  });

  // T-100 / G-01: 単純迷路 2000 エピソード — 貪欲リターン=最適リターン + 一致率 ≥ 90%
  // (全状態一致 100% は ε-greedy の訪問頻度の偏りで到達しない — SPEC §4 註・較正実験済み)
  it("G-01: 単純迷路がシード 1・2000 エピソードで収束する", () => {
    const params = {
      alpha: 0.5,
      gamma: GAMMA,
      epsilon: 0.2,
      maxStepsPerEpisode: 200,
    };
    const ts = runEpisodes(MAP_SIMPLE, createTrainer(MAP_SIMPLE, 1), params, 2000);
    assertConverged(MAP_SIMPLE, ts.q);
  });

  // T-101 / G-02: 崖歩き 2000 エピソード — 貪欲リターン=最適リターン + 一致率 ≥ 90%
  it("G-02: 崖歩きがシード 1・2000 エピソードで収束する", () => {
    const params = {
      alpha: 0.5,
      gamma: GAMMA,
      epsilon: 0.1,
      maxStepsPerEpisode: 200,
    };
    const ts = runEpisodes(MAP_CLIFF, createTrainer(MAP_CLIFF, 1), params, 2000);
    assertConverged(MAP_CLIFF, ts.q);
  });
});

/** 収束判定の共通部: 主判定=貪欲リターンが π* ロールアウトと一致、副判定=一致率 ≥ 90% */
function assertConverged(map: GridMap, q: number[][]): void {
  const { policy } = solve(map, GAMMA);
  const r = policyAgreement(map, q, policy);
  expect(r.ratio).toBeGreaterThanOrEqual(0.9);

  // 最適リターンの独立再計算: π* を貪欲に辿る決定論ロールアウト(無割引)
  const greedyReturn = evaluateGreedy(map, q, 200);
  let pos = map.start;
  let optReturn = 0;
  for (let i = 0; i < 200; i++) {
    const acts = policy[cellIndex(map, pos)];
    const res = step(map, pos, acts[0]);
    optReturn += res.reward;
    pos = res.next;
    if (res.done) break;
  }
  expect(greedyReturn).toBeCloseTo(optReturn, 9);
}

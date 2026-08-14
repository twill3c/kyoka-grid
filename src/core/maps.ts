// 内蔵マップ(F-10)。すべて validateMap 合格を T-010 で保証する。

import type { Cell, GridMap } from "./types";

function cells(list: Array<[number, number]>): Cell[] {
  return list.map(([x, y]) => ({ x, y }));
}

const REWARDS = { stepReward: -0.04, goalReward: 1, trapPenalty: -100 };

/**
 * 単純迷路 8×8(G-01 の対象)。
 * x=2(y=2..6)と x=5(y=1..5)の 2 枚の縦壁で S 字迂回を作る。
 * 袋小路を持たない(全セルが経路上)ため、ε-greedy の探索が全状態に届きやすい。
 */
export const MAP_SIMPLE: GridMap = {
  id: "simple",
  name: "単純迷路",
  width: 8,
  height: 8,
  start: { x: 0, y: 7 },
  goal: { x: 7, y: 0 },
  walls: cells([
    [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
    [5, 1], [5, 2], [5, 3], [5, 4], [5, 5],
  ]),
  traps: [],
  wind: [0, 0, 0, 0, 0, 0, 0, 0],
  ...REWARDS,
};

/**
 * 崖歩き 12×4(G-02 の対象)。最下段の開始とゴールの間が崖(罠)。
 * 崖すれすれの最短路と、安全だが長い上段迂回路のトレードオフを見せる。
 */
export const MAP_CLIFF: GridMap = {
  id: "cliff",
  name: "崖歩き",
  width: 12,
  height: 4,
  start: { x: 0, y: 3 },
  goal: { x: 11, y: 3 },
  walls: [],
  traps: cells([
    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
    [6, 3], [7, 3], [8, 3], [9, 3], [10, 3],
  ]),
  wind: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ...REWARDS,
};

/**
 * 風の格子 10×7(Sutton & Barto の windy gridworld 準拠)。
 * 中央の列で上向きの風が吹き、まっすぐ進めない。
 */
export const MAP_WINDY: GridMap = {
  id: "windy",
  name: "風の格子",
  width: 10,
  height: 7,
  start: { x: 0, y: 3 },
  goal: { x: 7, y: 3 },
  walls: [],
  traps: [],
  wind: [0, 0, 0, 1, 1, 1, 2, 2, 1, 0],
  ...REWARDS,
};

export const MAPS: readonly GridMap[] = [MAP_SIMPLE, MAP_CLIFF, MAP_WINDY];

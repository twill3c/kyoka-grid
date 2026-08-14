// 価値反復ソルバー(F-04)= テストオラクル(G-03)兼 UI のオラクル比較(F-09)。

import type { Action, GridMap } from "./types";
import { ACTIONS } from "./types";
import { cellIndex, isGoal, isWall, step } from "./gridworld";

export interface SolveResult {
  /** 状態価値 V*(セル index 順。壁・ゴールは 0) */
  v: number[];
  /** 最適行動集合 π*(タイは複数保持。壁・ゴールは空配列) */
  policy: Action[][];
  iterations: number;
}

const TOL = 1e-12;
const TIE_TOL = 1e-9;
const MAX_ITER = 100_000;

/** 行動価値 r + γ·V(s')(終端遷移は将来価値 0) */
function actionValue(
  map: GridMap,
  x: number,
  y: number,
  a: Action,
  gamma: number,
  v: number[],
): number {
  const r = step(map, { x, y }, a);
  return r.reward + (r.done ? 0 : gamma * v[cellIndex(map, r.next)]);
}

/** 価値反復。決定論的環境なので遷移確率は 1(Bellman 最適方程式の縮約写像) */
export function solve(map: GridMap, gamma: number): SolveResult {
  const n = map.width * map.height;
  const v: number[] = new Array(n).fill(0);
  let iterations = 0;

  for (; iterations < MAX_ITER; iterations++) {
    let delta = 0;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (isWall(map, { x, y }) || isGoal(map, { x, y })) continue;
        const idx = y * map.width + x;
        let best = -Infinity;
        for (const a of ACTIONS) {
          const q = actionValue(map, x, y, a, gamma, v);
          if (q > best) best = q;
        }
        delta = Math.max(delta, Math.abs(best - v[idx]));
        v[idx] = best;
      }
    }
    if (delta < TOL) break;
  }

  const policy: Action[][] = Array.from({ length: n }, () => []);
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (isWall(map, { x, y }) || isGoal(map, { x, y })) continue;
      const idx = y * map.width + x;
      const qs = ACTIONS.map((a) => actionValue(map, x, y, a, gamma, v));
      const best = Math.max(...qs);
      policy[idx] = ACTIONS.filter((a) => best - qs[a] < TIE_TOL);
    }
  }
  return { v, policy, iterations };
}

/**
 * Bellman 残差 max_s |V(s) − max_a [r + γ·V(s')]| の独立再計算(G-03)。
 * solve の収束判定とは別ループで計算し、オラクル自身を検証する。
 */
export function bellmanResidual(
  map: GridMap,
  gamma: number,
  v: number[],
): number {
  let residual = 0;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (isWall(map, { x, y }) || isGoal(map, { x, y })) continue;
      let best = -Infinity;
      for (const a of ACTIONS) {
        const q = actionValue(map, x, y, a, gamma, v);
        if (q > best) best = q;
      }
      residual = Math.max(residual, Math.abs(best - v[y * map.width + x]));
    }
  }
  return residual;
}

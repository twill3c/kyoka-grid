// グリッドワールド環境(F-02)。決定論的な遷移関数と構造検証。

import type { Action, Cell, GridMap, StepResult } from "./types";
import { ACTIONS } from "./types";

const DELTAS: readonly [number, number][] = [
  [0, -1], // 0: 上
  [1, 0], // 1: 右
  [0, 1], // 2: 下
  [-1, 0], // 3: 左
];

export function cellIndex(map: GridMap, c: Cell): number {
  return c.y * map.width + c.x;
}

export function inBounds(map: GridMap, c: Cell): boolean {
  return c.x >= 0 && c.y >= 0 && c.x < map.width && c.y < map.height;
}

function toSet(cells: Cell[]): Set<string> {
  return new Set(cells.map((c) => `${c.x},${c.y}`));
}

export function isWall(map: GridMap, c: Cell): boolean {
  return map.walls.some((w) => w.x === c.x && w.y === c.y);
}

export function isTrap(map: GridMap, c: Cell): boolean {
  return map.traps.some((t) => t.x === c.x && t.y === c.y);
}

export function isGoal(map: GridMap, c: Cell): boolean {
  return map.goal.x === c.x && map.goal.y === c.y;
}

/**
 * 遷移関数(純関数・決定論)。
 * 1. 行動方向へ 1 セル移動。盤外・壁なら静止
 * 2. 発地セルの列の風だけ上方向へ 1 セルずつ押し流す(盤端・壁で停止)
 * 3. 着地セルの判定: ゴール=+goalReward・done / 罠=+trapPenalty・開始点へ / それ以外は継続
 * 報酬には常に stepReward が加算される。
 */
export function step(map: GridMap, pos: Cell, action: Action): StepResult {
  const [dx, dy] = DELTAS[action];
  let cur: Cell = { x: pos.x + dx, y: pos.y + dy };
  if (!inBounds(map, cur) || isWall(map, cur)) {
    cur = pos;
  }
  // 風(発地セルの列で判定)
  const strength = map.wind[pos.x] ?? 0;
  for (let i = 0; i < strength; i++) {
    const up: Cell = { x: cur.x, y: cur.y - 1 };
    if (!inBounds(map, up) || isWall(map, up)) break;
    cur = up;
  }
  if (isGoal(map, cur)) {
    return { next: cur, reward: map.stepReward + map.goalReward, done: true };
  }
  if (isTrap(map, cur)) {
    return {
      next: { ...map.start },
      reward: map.stepReward + map.trapPenalty,
      done: false,
    };
  }
  return { next: cur, reward: map.stepReward, done: false };
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** 構造検証(T-010 / T-011)。UI・テスト・オラクルの前提を守る */
export function validateMap(map: GridMap): ValidationResult {
  const errors: string[] = [];
  const wallSet = toSet(map.walls);
  const trapSet = toSet(map.traps);

  if (map.width < 2 || map.height < 1) errors.push("盤面が小さすぎる");
  if (map.wind.length !== map.width) errors.push("wind の長さが width と不一致");
  if (!inBounds(map, map.start)) errors.push("開始が盤外");
  if (!inBounds(map, map.goal)) errors.push("ゴールが盤外");
  for (const w of map.walls) {
    if (!inBounds(map, w)) errors.push(`壁が盤外: (${w.x},${w.y})`);
  }
  for (const t of map.traps) {
    if (!inBounds(map, t)) errors.push(`罠が盤外: (${t.x},${t.y})`);
  }
  const sKey = `${map.start.x},${map.start.y}`;
  const gKey = `${map.goal.x},${map.goal.y}`;
  if (sKey === gKey) errors.push("開始=ゴール");
  if (wallSet.has(sKey)) errors.push("開始=壁");
  if (wallSet.has(gKey)) errors.push("ゴール=壁");
  if (trapSet.has(sKey)) errors.push("開始=罠");
  if (trapSet.has(gKey)) errors.push("ゴール=罠");

  if (errors.length === 0) {
    // 到達可能性: 実際の遷移(風・罠込み)でゴールへ届くか
    const reached = occupiableCells(map).some((c) => isGoal(map, c));
    if (!reached) errors.push("ゴール到達不能");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * エージェントが占有しうる状態の列挙(開始から遷移関数で BFS)。
 * 罠セルは占有されない(踏んだ瞬間に開始点へ戻るため)。ゴールは終端状態として含む。
 */
export function occupiableCells(map: GridMap): Cell[] {
  const seen = new Set<string>([`${map.start.x},${map.start.y}`]);
  const queue: Cell[] = [{ ...map.start }];
  const out: Cell[] = [];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    out.push(cur);
    if (isGoal(map, cur)) continue; // 終端からは遷移しない
    for (const a of ACTIONS) {
      const { next } = step(map, cur, a);
      const k = `${next.x},${next.y}`;
      if (!seen.has(k)) {
        seen.add(k);
        queue.push(next);
      }
    }
  }
  return out;
}

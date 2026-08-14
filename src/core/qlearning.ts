// 表形式 Q学習(F-03)と評価ユーティリティ(F-08 / F-09)。すべて純関数。

import type { Action, Cell, GridMap } from "./types";
import { cellIndex, isGoal, occupiableCells, step } from "./gridworld";
import { randInt, rngInit, rngNext } from "./prng";

export interface QParams {
  alpha: number;
  gamma: number;
  epsilon: number;
  maxStepsPerEpisode: number;
}

export interface LastUpdate {
  state: number;
  action: Action;
  tdError: number;
  /** この行動が ε 探索(ランダム選択)だったか(F-05 のエージェント色変化用) */
  explored: boolean;
}

export interface TrainerState {
  /** Q テーブル [セル index][行動] */
  q: number[][];
  rngState: number;
  pos: Cell;
  episode: number;
  stepsInEpisode: number;
  episodeReturn: number;
  /** エピソードごとの獲得報酬(学習曲線 F-08 の素材) */
  returns: number[];
  /** 直近の TD 更新(F-11 のハイライト用) */
  lastUpdate: LastUpdate | null;
}

export function createTrainer(map: GridMap, seed: number): TrainerState {
  const n = map.width * map.height;
  return {
    q: Array.from({ length: n }, () => [0, 0, 0, 0]),
    rngState: rngInit(seed),
    pos: { ...map.start },
    episode: 0,
    stepsInEpisode: 0,
    episodeReturn: 0,
    returns: [],
    lastUpdate: null,
  };
}

/** 貪欲行動(タイは最小 index)*/
export function greedyAction(qRow: number[]): Action {
  let best = 0;
  for (let a = 1; a < 4; a++) {
    if (qRow[a] > qRow[best]) best = a;
  }
  return best as Action;
}

/**
 * 学習 1 ステップ(純関数)。ε-greedy で行動し TD 更新する。
 * パラメータは毎ステップ渡すため、実行中の変更が次ステップから反映される(F-07 / T-033)。
 */
export function trainerStep(
  map: GridMap,
  ts: TrainerState,
  params: QParams,
): TrainerState {
  const s = cellIndex(map, ts.pos);

  // 行動選択(ε-greedy)。乱数消費は「ε 判定 1 回 + 探索時のみ 1 回」で固定
  const roll = rngNext(ts.rngState);
  let action: Action;
  let rngState: number;
  const explored = roll.value < params.epsilon;
  if (explored) {
    const ri = randInt(roll.state, 0, 3);
    action = ri.value as Action;
    rngState = ri.state;
  } else {
    action = greedyAction(ts.q[s]);
    rngState = roll.state;
  }

  const res = step(map, ts.pos, action);
  const sNext = cellIndex(map, res.next);
  const target =
    res.reward + (res.done ? 0 : params.gamma * Math.max(...ts.q[sNext]));
  const tdError = target - ts.q[s][action];

  // 変更行だけ複製(純関数のまま O(1) 更新)
  const q = ts.q.slice();
  q[s] = q[s].slice();
  q[s][action] += params.alpha * tdError;

  const stepsInEpisode = ts.stepsInEpisode + 1;
  const episodeReturn = ts.episodeReturn + res.reward;
  const lastUpdate: LastUpdate = { state: s, action, tdError, explored };

  if (res.done || stepsInEpisode >= params.maxStepsPerEpisode) {
    return {
      q,
      rngState,
      pos: { ...map.start },
      episode: ts.episode + 1,
      stepsInEpisode: 0,
      episodeReturn: 0,
      returns: [...ts.returns, episodeReturn],
      lastUpdate,
    };
  }
  return {
    q,
    rngState,
    pos: res.next,
    episode: ts.episode,
    stepsInEpisode,
    episodeReturn,
    returns: ts.returns,
    lastUpdate,
  };
}

/** episodes 到達まで学習(予算付き・T-040 の上限はエピソード内でも効く) */
export function runEpisodes(
  map: GridMap,
  ts: TrainerState,
  params: QParams,
  episodes: number,
): TrainerState {
  const budget = (episodes - ts.episode) * params.maxStepsPerEpisode + 1;
  let cur = ts;
  for (let i = 0; cur.episode < episodes && i < budget; i++) {
    cur = trainerStep(map, cur, params);
  }
  return cur;
}

export interface AgreementResult {
  agree: number;
  total: number;
  ratio: number;
}

/**
 * 方策一致率(F-09 / T-050)。
 * 分母 = 占有可能な非終端セル。argmax Q が π* 集合に属せば一致(タイ許容)。
 */
export function policyAgreement(
  map: GridMap,
  q: number[][],
  policy: Action[][],
): AgreementResult {
  let agree = 0;
  let total = 0;
  for (const c of occupiableCells(map)) {
    if (isGoal(map, c)) continue;
    const idx = cellIndex(map, c);
    total++;
    if (policy[idx].includes(greedyAction(q[idx]))) agree++;
  }
  return { agree, total, ratio: total === 0 ? 0 : agree / total };
}

/** 貪欲方策の評価リターン(無割引・決定論ロールアウト・予算付き) */
export function evaluateGreedy(
  map: GridMap,
  q: number[][],
  maxSteps: number,
): number {
  let pos = { ...map.start };
  let total = 0;
  for (let i = 0; i < maxSteps; i++) {
    const res = step(map, pos, greedyAction(q[cellIndex(map, pos)]));
    total += res.reward;
    pos = res.next;
    if (res.done) break;
  }
  return total;
}

/** 移動平均(F-08)。窓未満の先頭は逐次平均 */
export function movingAverage(xs: number[], window: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < xs.length; i++) {
    sum += xs[i];
    if (i >= window) sum -= xs[i - window];
    out.push(sum / Math.min(i + 1, window));
  }
  return out;
}

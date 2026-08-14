// 可視化用の純関数(F-05)。配色は dataviz 規範の発散ペア(blue↔red・中立グレー)。
// ダーク面(#101418 系)前提の単一テーマ。

import type { Cell } from "./types";

/** 発散配色の中立色(V=0)— ダーク面の neutral gray */
export const HEAT_NEUTRAL = "#383835";

/** 正極(高価値)= blue 系ランプの終端 */
const POS_POLE: [number, number, number] = [57, 135, 229]; // #3987e5
/** 負極(低価値)= red 系ランプの終端 */
const NEG_POLE: [number, number, number] = [230, 103, 103]; // #e66767
const NEUTRAL_RGB: [number, number, number] = [0x38, 0x38, 0x35];

/** 各セルの状態価値 V(s) = max_a Q(s,a)(T-070) */
export function stateValues(q: number[][]): number[] {
  return q.map((row) => Math.max(...row));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((c) => Math.round(c).toString(16).padStart(2, "0"))
      .join("")
      .toLowerCase()
  );
}

/**
 * 発散ヒートマップ(T-071)。v=0 は中立、正は blue 極へ、負は red 極へ。
 * posMax / negAbsMax は表示スケール(それぞれ正・負の絶対値の最大)。
 * √ イージングで中間域の差を見せる(罠の −100 が支配して他が潰れるのを防ぐ)。
 */
export function heatColor(
  v: number,
  posMax: number,
  negAbsMax: number,
): string {
  if (v === 0) return HEAT_NEUTRAL;
  const pole = v > 0 ? POS_POLE : NEG_POLE;
  const scale = v > 0 ? Math.max(posMax, 1e-12) : Math.max(negAbsMax, 1e-12);
  const t = Math.sqrt(Math.min(Math.abs(v) / scale, 1));
  return hex([
    lerp(NEUTRAL_RGB[0], pole[0], t),
    lerp(NEUTRAL_RGB[1], pole[1], t),
    lerp(NEUTRAL_RGB[2], pole[2], t),
  ]);
}

/**
 * 方策矢印の不透明度(T-072)。最良と次善の Q 差(= 確信度)に単調。
 * 差 0 でも矢印が見えるよう下限 0.25、差 1 以上で飽和。
 */
export function arrowOpacity(qRow: number[]): number {
  const sorted = [...qRow].sort((a, b) => b - a);
  const gap = sorted[0] - sorted[1];
  return 0.25 + 0.75 * Math.min(gap, 1);
}

/**
 * 学習曲線の SVG points 文字列(T-074)。値域を [0, height] へ正規化(大きいほど上)。
 * 空列は空文字、定数列・1 点は中央高さに置く。
 */
export function curvePoints(
  xs: number[],
  width: number,
  height: number,
): string {
  if (xs.length === 0) return "";
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const span = max - min;
  const dx = xs.length > 1 ? width / (xs.length - 1) : 0;
  return xs
    .map((v, i) => {
      const t = span === 0 ? 0.5 : (v - min) / span;
      return `${i * dx},${(1 - t) * height}`;
    })
    .join(" ");
}

/** 軌跡リングバッファ(T-073)。直近 cap 点のみ保持 */
export function pushTrail(
  trail: Cell[],
  pos: Cell,
  cap: number,
): Cell[] {
  const next = [...trail, pos];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

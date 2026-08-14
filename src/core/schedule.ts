// 描画と学習の分離(N-03)。1 フレームに実行する学習ステップ数の上限。

export const SPEEDS = [1, 10, 100] as const;
export type Speed = (typeof SPEEDS)[number];

/** 1 フレームの学習バッチ上限。UI をブロックしない値に固定する */
export const MAX_STEPS_PER_FRAME = 200;

export function batchSize(speed: Speed): number {
  return Math.min(speed, MAX_STEPS_PER_FRAME);
}

// kyoka-grid コア型定義。src/core は純関数のみ(AGENTS.md §4)

/** 行動: 0=上, 1=右, 2=下, 3=左 */
export type Action = 0 | 1 | 2 | 3;

export const ACTIONS: readonly Action[] = [0, 1, 2, 3] as const;

export interface Cell {
  x: number;
  y: number;
}

/**
 * グリッドワールド定義(F-02)。
 * - 罠: 踏むと trapPenalty を受けて開始点へ戻る(エピソード継続・崖歩き型)
 * - 風: wind[列] のセル数だけ上方向へ押し流される(発地セルの列で判定・盤端/壁で停止)
 */
export interface GridMap {
  id: string;
  name: string;
  width: number;
  height: number;
  start: Cell;
  goal: Cell;
  walls: Cell[];
  traps: Cell[];
  wind: number[];
  stepReward: number;
  goalReward: number;
  trapPenalty: number;
}

export interface StepResult {
  next: Cell;
  reward: number;
  done: boolean;
}

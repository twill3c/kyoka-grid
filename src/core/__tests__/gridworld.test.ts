import { describe, expect, it } from "vitest";
import type { GridMap } from "@/core/types";
import { ACTIONS } from "@/core/types";
import {
  cellIndex,
  occupiableCells,
  step,
  validateMap,
} from "@/core/gridworld";
import { MAPS, MAP_CLIFF, MAP_SIMPLE, MAP_WINDY } from "@/core/maps";

// 合成フィクスチャ: 3×3・障害なし・風なし
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

describe("gridworld", () => {
  // T-010: 内蔵全マップが構造検証に合格
  it("内蔵全マップが validateMap に合格する", () => {
    expect(MAPS.length).toBeGreaterThanOrEqual(3);
    for (const m of MAPS) {
      const r = validateMap(m);
      expect(r.errors).toEqual([]);
      expect(r.ok).toBe(true);
    }
    // 3 種の顔ぶれ(F-10)
    expect(MAPS).toContain(MAP_SIMPLE);
    expect(MAPS).toContain(MAP_CLIFF);
    expect(MAPS).toContain(MAP_WINDY);
  });

  // T-011: 壊れたマップはいずれも不合格
  it("壊れたマップを検出する", () => {
    const broken: Array<Partial<GridMap>> = [
      { start: { x: -1, y: 0 } }, // 盤外開始
      { goal: { x: 99, y: 0 } }, // 盤外ゴール
      { walls: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }] }, // 壁で分断
      { traps: [{ x: 0, y: 2 }] }, // 開始=罠
      { walls: [{ x: 2, y: 0 }] }, // ゴール=壁
    ];
    for (const patch of broken) {
      const m = { ...open3x3, ...patch };
      expect(validateMap(m).ok).toBe(false);
    }
  });

  // T-012: 通常移動・壁/盤外で静止・報酬 −0.04
  it("通常移動と壁・盤外での静止", () => {
    // 右へ 1 歩
    const r1 = step(open3x3, { x: 0, y: 2 }, 1);
    expect(r1.next).toEqual({ x: 1, y: 2 });
    expect(r1.reward).toBeCloseTo(-0.04, 10);
    expect(r1.done).toBe(false);
    // 盤外(下端で下)→ 静止
    const r2 = step(open3x3, { x: 0, y: 2 }, 2);
    expect(r2.next).toEqual({ x: 0, y: 2 });
    expect(r2.done).toBe(false);
    // 壁 → 静止
    const walled: GridMap = { ...open3x3, walls: [{ x: 1, y: 2 }] };
    const r3 = step(walled, { x: 0, y: 2 }, 1);
    expect(r3.next).toEqual({ x: 0, y: 2 });
  });

  // T-013: ゴール到達で +1(ステップコスト込み)・done
  it("ゴール到達で done かつ報酬 = stepReward + goalReward", () => {
    const r = step(open3x3, { x: 2, y: 1 }, 0);
    expect(r.next).toEqual({ x: 2, y: 0 });
    expect(r.reward).toBeCloseTo(-0.04 + 1, 10);
    expect(r.done).toBe(true);
  });

  // T-014: 罠踏みで −100・開始点へ戻る・継続
  it("罠踏みで開始点へ戻り、エピソードは継続する", () => {
    const trapped: GridMap = { ...open3x3, traps: [{ x: 1, y: 2 }] };
    const r = step(trapped, { x: 0, y: 2 }, 1);
    expect(r.next).toEqual(trapped.start);
    expect(r.reward).toBeCloseTo(-0.04 - 100, 10);
    expect(r.done).toBe(false);
  });

  // T-015: 風列の通過で上向きに追加移動・盤端でクランプ
  it("風で上へ押し流され、盤端でクランプされる", () => {
    const windy: GridMap = { ...open3x3, wind: [0, 1, 0] };
    // 発地 x=1(風 1)から右へ → (2,2) が風で (2,1) へ
    const r1 = step(windy, { x: 1, y: 2 }, 1);
    expect(r1.next).toEqual({ x: 2, y: 1 });
    // 発地 x=1・y=0(上端)から右へ → 風は押せず (2,0) のまま = ゴール
    const r2 = step(windy, { x: 1, y: 0 }, 1);
    expect(r2.next).toEqual({ x: 2, y: 0 });
    expect(r2.done).toBe(true);
  });

  // 占有可能状態の列挙(T-050 の分母の基礎)
  it("occupiableCells は罠・壁・到達不能セルを含まない", () => {
    const trapped: GridMap = { ...open3x3, traps: [{ x: 1, y: 1 }] };
    const cells = occupiableCells(trapped);
    const idxs = cells.map((c) => cellIndex(trapped, c));
    expect(idxs).not.toContain(cellIndex(trapped, { x: 1, y: 1 }));
    // ゴールは終端状態として含む(一致率の分母では呼び出し側が除く)
    expect(idxs).toContain(cellIndex(trapped, trapped.goal));
    // 全域到達可能な 3×3 なら 壁0・罠1 を除く 8 セル
    expect(cells.length).toBe(8);
    for (const a of ACTIONS) {
      expect([0, 1, 2, 3]).toContain(a);
    }
  });
});

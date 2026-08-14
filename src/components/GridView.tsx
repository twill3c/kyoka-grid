"use client";

// グリッド描画(F-05)。SVG 1 枚に 4 レイヤー:
// 1. 価値ヒートマップ(セル背景) 2. 方策矢印(確信度=不透明度)
// 3. 軌跡残像 4. エージェント(探索行動時は色が変わる)

import type { Action, Cell, GridMap } from "@/core/types";
import { cellIndex, isGoal, isTrap, isWall } from "@/core/gridworld";
import type { LastUpdate } from "@/core/qlearning";
import { greedyAction } from "@/core/qlearning";
import { arrowOpacity, heatColor, stateValues } from "@/core/viz";

const CELL = 48;

const COLORS = {
  wall: "#22262b",
  gridline: "#2c2c2a",
  goal: "#0ca30c",
  trap: "#d03b3b",
  agent: "#d95926",
  agentExplore: "#c98500",
  trail: "#d95926",
  arrow: "#e8edf2",
  oracle: "#c3c2b7",
  tdPos: "#3987e5",
  tdNeg: "#e66767",
};

/** 行動 → 回転角(0=上 基準) */
const ROT: Record<Action, number> = { 0: 0, 1: 90, 2: 180, 3: 270 };

export interface GridViewProps {
  map: GridMap;
  q: number[][];
  pos: Cell;
  trail: Cell[];
  lastUpdate: LastUpdate | null;
  /** オラクル方策のオーバーレイ(F-09・null で非表示) */
  oraclePolicy: Action[][] | null;
  /** 1 ステップモードで直近更新セルを光らせる(F-11) */
  highlightUpdate: boolean;
}

export function GridView({
  map,
  q,
  pos,
  trail,
  lastUpdate,
  oraclePolicy,
  highlightUpdate,
}: GridViewProps) {
  const v = stateValues(q);
  let posMax = 0;
  let negAbsMax = 0;
  for (let i = 0; i < v.length; i++) {
    if (v[i] > posMax) posMax = v[i];
    if (-v[i] > negAbsMax) negAbsMax = -v[i];
  }

  const cells = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const c = { x, y };
      const idx = cellIndex(map, c);
      const wall = isWall(map, c);
      const trap = isTrap(map, c);
      const goal = isGoal(map, c);
      const fill = wall
        ? COLORS.wall
        : heatColor(v[idx], posMax, negAbsMax);
      cells.push(
        <g key={idx} transform={`translate(${x * CELL}, ${y * CELL})`}>
          <rect
            width={CELL}
            height={CELL}
            fill={fill}
            stroke={COLORS.gridline}
            strokeWidth={1}
          />
          {goal && (
            <>
              <rect
                width={CELL}
                height={CELL}
                fill="none"
                stroke={COLORS.goal}
                strokeWidth={3}
              />
              <text
                x={CELL / 2}
                y={CELL / 2 + 6}
                textAnchor="middle"
                fontSize={18}
                fontWeight={700}
                fill={COLORS.goal}
              >
                G
              </text>
            </>
          )}
          {trap && (
            <text
              x={CELL / 2}
              y={CELL / 2 + 6}
              textAnchor="middle"
              fontSize={16}
              fill={COLORS.trap}
            >
              ▲
            </text>
          )}
          {map.start.x === x && map.start.y === y && !goal && (
            <text
              x={6}
              y={14}
              fontSize={11}
              fill={COLORS.oracle}
            >
              S
            </text>
          )}
          {/* 方策矢印(壁・罠・ゴール以外) */}
          {!wall && !trap && !goal && (
            <g
              transform={`rotate(${ROT[greedyAction(q[idx])]}, ${CELL / 2}, ${CELL / 2})`}
              opacity={arrowOpacity(q[idx])}
            >
              <path
                d={`M ${CELL / 2} ${CELL / 2 - 10} L ${CELL / 2 - 6} ${CELL / 2 + 6} L ${CELL / 2 + 6} ${CELL / 2 + 6} Z`}
                fill={COLORS.arrow}
              />
            </g>
          )}
          {/* オラクル方策の半透明オーバーレイ(白抜き輪郭・左上寄せ) */}
          {oraclePolicy && !wall && !trap && !goal && (
            <g opacity={0.55}>
              {oraclePolicy[idx].map((a) => (
                <g
                  key={a}
                  transform={`rotate(${ROT[a]}, 12, 12)`}
                >
                  <path
                    d="M 12 5 L 8 16 L 16 16 Z"
                    fill="none"
                    stroke={COLORS.oracle}
                    strokeWidth={1.5}
                  />
                </g>
              ))}
            </g>
          )}
          {/* 直近 TD 更新のハイライト(F-11) */}
          {highlightUpdate && lastUpdate && lastUpdate.state === idx && (
            <rect
              width={CELL}
              height={CELL}
              fill="none"
              stroke={lastUpdate.tdError >= 0 ? COLORS.tdPos : COLORS.tdNeg}
              strokeWidth={3}
            />
          )}
        </g>,
      );
    }
  }

  const trailPoints = trail
    .map((t) => `${t.x * CELL + CELL / 2},${t.y * CELL + CELL / 2}`)
    .join(" ");
  const explored = lastUpdate?.explored ?? false;

  return (
    <svg
      viewBox={`0 0 ${map.width * CELL} ${map.height * CELL}`}
      role="img"
      aria-label={`${map.name} の学習状況`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {cells}
      {/* 軌跡残像 */}
      {trail.length > 1 && (
        <polyline
          points={trailPoints}
          fill="none"
          stroke={COLORS.trail}
          strokeWidth={2}
          strokeOpacity={0.4}
          strokeLinejoin="round"
        />
      )}
      {/* エージェント(探索行動はアンバー、貪欲はオレンジ) */}
      <circle
        cx={pos.x * CELL + CELL / 2}
        cy={pos.y * CELL + CELL / 2}
        r={CELL * 0.28}
        fill={explored ? COLORS.agentExplore : COLORS.agent}
        stroke="#101418"
        strokeWidth={2}
      />
    </svg>
  );
}

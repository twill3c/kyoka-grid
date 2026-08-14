"use client";

// 学習曲線(F-08)。エピソード獲得報酬の移動平均(窓 20)を 1 系列の折れ線で表示。
// 単一系列のため凡例は持たない(タイトルが系列名を兼ねる)。

import { movingAverage } from "@/core/qlearning";
import { curvePoints } from "@/core/viz";

const W = 320;
const H = 96;
const WINDOW = 20;

export function LearningCurve({ returns }: { returns: number[] }) {
  const ma = movingAverage(returns, WINDOW);
  const points = curvePoints(ma, W, H);
  const latest = ma.length > 0 ? ma[ma.length - 1] : null;

  return (
    <figure className="curve">
      <figcaption>
        エピソード報酬(移動平均 {WINDOW})
        {latest !== null && (
          <span className="curve-latest"> {latest.toFixed(2)}</span>
        )}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="エピソード報酬の移動平均の推移"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <line
          x1={0}
          y1={H}
          x2={W}
          y2={H}
          stroke="#383835"
          strokeWidth={1}
        />
        {points !== "" && (
          <polyline
            points={points}
            fill="none"
            stroke="#3987e5"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
        {points === "" && (
          <text
            x={W / 2}
            y={H / 2}
            textAnchor="middle"
            fontSize={12}
            fill="#898781"
          >
            エピソード完了を待機中
          </text>
        )}
      </svg>
    </figure>
  );
}

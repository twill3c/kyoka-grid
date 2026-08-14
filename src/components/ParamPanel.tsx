"use client";

// パラメータパネル(F-07)。α/γ/ε スライダー。変更は次ステップから反映される
// (trainerStep がパラメータを毎ステップ受け取る設計のため、配線は値を渡すだけ)。

import type { QParams } from "@/core/qlearning";

interface SliderSpec {
  key: "alpha" | "gamma" | "epsilon";
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderSpec[] = [
  { key: "alpha", label: "α 学習率", min: 0.05, max: 1, step: 0.05 },
  { key: "gamma", label: "γ 割引率", min: 0.5, max: 0.99, step: 0.01 },
  { key: "epsilon", label: "ε 探索率", min: 0, max: 1, step: 0.05 },
];

export function ParamPanel({
  params,
  onChange,
}: {
  params: QParams;
  onChange: (next: QParams) => void;
}) {
  return (
    <div className="params" role="group" aria-label="学習パラメータ">
      {SLIDERS.map((s) => (
        <label key={s.key} className="param">
          <span className="param-label">
            {s.label}
            <span className="param-value">{params[s.key].toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={params[s.key]}
            onChange={(e) =>
              onChange({ ...params, [s.key]: Number(e.target.value) })
            }
          />
        </label>
      ))}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { GridView } from "@/components/GridView";
import { LearningCurve } from "@/components/LearningCurve";
import { ParamPanel } from "@/components/ParamPanel";
import { MAPS } from "@/core/maps";
import type { GridMap } from "@/core/types";
import type { QParams } from "@/core/qlearning";
import { policyAgreement } from "@/core/qlearning";
import type { Speed } from "@/core/schedule";
import { SPEEDS } from "@/core/schedule";
import { solve } from "@/core/valueIteration";
import { FOOTER_LINKS } from "@/lib/links";
import { useTrainerLoop } from "@/lib/useTrainerLoop";

const SEED = 1;

export default function Home() {
  const [mapId, setMapId] = useState(MAPS[0].id);
  const [params, setParams] = useState<QParams>({
    alpha: 0.5,
    gamma: 0.95,
    epsilon: 0.2,
    maxStepsPerEpisode: 200,
  });
  const map = MAPS.find((m) => m.id === mapId) ?? MAPS[0];

  return (
    <main className="app">
      <header className="header">
        <h1>kyoka-grid</h1>
        <p className="subtitle">
          Q学習エージェントの学習過程をリアルタイム可視化
        </p>
      </header>

      <nav className="map-tabs" aria-label="マップ選択">
        {MAPS.map((m) => (
          <button
            type="button"
            key={m.id}
            className={m.id === mapId ? "active" : ""}
            onClick={() => setMapId(m.id)}
          >
            {m.name}
          </button>
        ))}
      </nav>

      {/* key で remount してマップ切替時に学習状態を作り直す(useTrainerLoop の制約) */}
      <Playground
        key={map.id}
        map={map}
        params={params}
        onParamsChange={setParams}
      />

      <footer className="footer">
        {FOOTER_LINKS.map((l, i) => (
          <span key={l.href}>
            {i > 0 && " ・ "}
            <a href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
            {l.label === "MIT License" && " © 2026 坂田哲朗"}
          </span>
        ))}
      </footer>
    </main>
  );
}

function Playground({
  map,
  params,
  onParamsChange,
}: {
  map: GridMap;
  params: QParams;
  onParamsChange: (next: QParams) => void;
}) {
  const [showOracle, setShowOracle] = useState(false);
  const loop = useTrainerLoop(map, SEED, params);
  const { trainer } = loop;

  // オラクル(価値反復)。マップ・γ が変わったときだけ再計算
  const oracle = useMemo(() => solve(map, params.gamma), [map, params.gamma]);
  const agreement = policyAgreement(map, trainer.q, oracle.policy);

  return (
    <div className="layout">
      <section className="board">
        <GridView
          map={map}
          q={trainer.q}
          pos={trainer.pos}
          trail={loop.trail}
          lastUpdate={trainer.lastUpdate}
          oraclePolicy={showOracle ? oracle.policy : null}
          highlightUpdate={!loop.playing}
        />
        <div className="controls" aria-label="実行制御">
          <div className="control-row">
            {loop.playing ? (
              <button type="button" onClick={loop.pause}>
                ⏸ 一時停止
              </button>
            ) : (
              <button type="button" onClick={loop.play}>
                ▶ 再生
              </button>
            )}
            <button type="button" onClick={loop.stepOnce}>
              1 ステップ
            </button>
            <button type="button" onClick={loop.reset}>
              リセット
            </button>
          </div>
          <div className="control-row" role="group" aria-label="速度">
            {SPEEDS.map((s: Speed) => (
              <button
                type="button"
                key={s}
                className={loop.speed === s ? "active" : ""}
                onClick={() => loop.setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="panel">
        <ParamPanel params={params} onChange={onParamsChange} />

        <div className="oracle">
          <button
            type="button"
            className={showOracle ? "active" : ""}
            onClick={() => setShowOracle((v) => !v)}
            aria-pressed={showOracle}
          >
            π* オーバーレイ {showOracle ? "ON" : "OFF"}
          </button>
          <div className="agreement">
            <span className="agreement-label">最適方策との一致率</span>
            <span className="agreement-value">
              {(agreement.ratio * 100).toFixed(1)}%
            </span>
            <span className="agreement-detail">
              {agreement.agree}/{agreement.total} セル
            </span>
          </div>
        </div>

        <LearningCurve returns={trainer.returns} />

        <dl className="stats">
          <div>
            <dt>エピソード</dt>
            <dd>{trainer.episode}</dd>
          </div>
          <div>
            <dt>ステップ</dt>
            <dd>{trainer.stepsInEpisode}</dd>
          </div>
          <div>
            <dt>直近リターン</dt>
            <dd>
              {trainer.returns.length > 0
                ? trainer.returns[trainer.returns.length - 1].toFixed(2)
                : "—"}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

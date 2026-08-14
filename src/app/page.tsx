"use client";

import { useState } from "react";
import { GridView } from "@/components/GridView";
import { MAP_SIMPLE } from "@/core/maps";
import type { QParams } from "@/core/qlearning";
import type { Speed } from "@/core/schedule";
import { SPEEDS } from "@/core/schedule";
import { useTrainerLoop } from "@/lib/useTrainerLoop";

const SEED = 1;

export default function Home() {
  const [params] = useState<QParams>({
    alpha: 0.5,
    gamma: 0.95,
    epsilon: 0.2,
    maxStepsPerEpisode: 200,
  });
  const map = MAP_SIMPLE;
  const loop = useTrainerLoop(map, SEED, params);
  const { trainer } = loop;

  return (
    <main className="app">
      <header className="header">
        <h1>kyoka-grid</h1>
        <p className="subtitle">
          Q学習エージェントの学習過程をリアルタイム可視化 — {map.name}
        </p>
      </header>

      <section className="board">
        <GridView
          map={map}
          q={trainer.q}
          pos={trainer.pos}
          trail={loop.trail}
          lastUpdate={trainer.lastUpdate}
          oraclePolicy={null}
          highlightUpdate={!loop.playing}
        />
      </section>

      <section className="controls" aria-label="実行制御">
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
      </section>
    </main>
  );
}

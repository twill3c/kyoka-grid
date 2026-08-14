"use client";

// 学習ループフック(F-06 / N-03)。描画は rAF、学習は 1 フレームあたり
// batchSize(speed) ステップに制限して UI をブロックしない。

import { useCallback, useEffect, useRef, useState } from "react";
import type { Cell, GridMap } from "@/core/types";
import type { QParams, TrainerState } from "@/core/qlearning";
import { createTrainer, trainerStep } from "@/core/qlearning";
import type { Speed } from "@/core/schedule";
import { batchSize } from "@/core/schedule";
import { pushTrail } from "@/core/viz";

const TRAIL_CAP = 60;

interface LoopState {
  trainer: TrainerState;
  trail: Cell[];
}

export interface TrainerLoop {
  trainer: TrainerState;
  trail: Cell[];
  playing: boolean;
  speed: Speed;
  play: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (s: Speed) => void;
}

export function useTrainerLoop(
  map: GridMap,
  seed: number,
  params: QParams,
): TrainerLoop {
  const [state, setState] = useState<LoopState>(() => ({
    trainer: createTrainer(map, seed),
    trail: [],
  }));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);

  // rAF コールバックから最新値を読むための ref(effect の再購読を避ける)
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  /** n ステップ進める(エピソード切替で軌跡をリセット) */
  const advance = useCallback(
    (n: number) => {
      setState((cur) => {
        let ts = cur.trainer;
        let trail = cur.trail;
        for (let i = 0; i < n; i++) {
          const episodeBefore = ts.episode;
          ts = trainerStep(map, ts, paramsRef.current);
          trail =
            ts.episode !== episodeBefore ? [] : pushTrail(trail, ts.pos, TRAIL_CAP);
        }
        return { trainer: ts, trail };
      });
    },
    [map],
  );

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      advance(batchSize(speedRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, advance]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const stepOnce = useCallback(() => {
    setPlaying(false);
    advance(1);
  }, [advance]);
  const reset = useCallback(() => {
    setPlaying(false);
    setState({ trainer: createTrainer(map, seed), trail: [] });
  }, [map, seed]);

  // マップ・シード変更時は学習状態をリセット(F-10)
  useEffect(() => {
    setPlaying(false);
    setState({ trainer: createTrainer(map, seed), trail: [] });
  }, [map, seed]);

  return {
    trainer: state.trainer,
    trail: state.trail,
    playing,
    speed,
    play,
    pause,
    stepOnce,
    reset,
    setSpeed,
  };
}

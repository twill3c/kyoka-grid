# CLAUDE.md

@AGENTS.md

上記ハーネスがこのリポジトリの正本ルール。要点のみ再掲する:

- 仕様の正本は SPEC.md。変更は スペック → テスト → 実装 の順。
- すべてのタスクは 7 段階ループプロトコル(AGENTS.md 末尾の共通規律)で進め、
  `python harness/looplog.py append` で `logs/loops/{loop_id}.jsonl` に記録する。
  失敗は気づいた瞬間に FAILURE_TAXONOMY のコード付きで記録する。
- 完了条件は `npm run verify` green + `looplog.py validate` 合格。
- `src/core` は純関数のみ(乱数はシード付き PRNG を注入、状態は TrainerState で持ち回り)・
  カバレッジ 90% 以上を維持。決定性(同一シード + 同一パラメータ → 同一 Q テーブル)を壊さない。
- 学習ゲートの正本は SPEC §4 G-xx(= テスト T-1xx)。ゲート自体を緩める変更は人間の承認が必要。
- 価値反復(src/core/valueIteration.ts)がテストオラクル。オラクル自身は Bellman 残差の
  独立再計算(G-03)で検証する。
- scaffold ブロック(AGENTS.md 末尾)と `.wt/gate.json` の上限は直接編集しない。

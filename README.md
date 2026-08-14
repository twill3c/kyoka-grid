# kyoka-grid — 強化学習グリッドワールド可視化

Q学習エージェントが迷路・崖歩き・風の格子を試行錯誤で学ぶ過程を、
価値ヒートマップ・方策矢印・行動軌跡としてリアルタイム可視化する教材アプリ。

- 「色(価値)が広がり、矢印(方策)が揃い、軌跡(行動)が直線になる」3 つの収束を同時に見せる
- 価値反復で厳密に解いた最適方策 π\* をオーバーレイ表示し、学習との一致率 % を常時表示
- ブラウザ完結(表形式 Q学習を純 TypeScript 実装)・静的エクスポート・外部通信なし

## 開発

```bash
npm install
npm run dev      # 開発サーバ
npm run verify   # 品質ゲート(typecheck + lint + test + build)
```

仕様は [SPEC.md](SPEC.md)、テスト仕様は [TEST_SPEC.md](TEST_SPEC.md)、
開発規範は [AGENTS.md](AGENTS.md) を参照。

## アーキテクチャ

- `src/core/` — 純関数のみ: 環境(gridworld)・Q学習(qlearning)・価値反復オラクル(valueIteration)・シード付き PRNG(prng)・内蔵マップ(maps)
- `src/app/`, `src/components/` — Next.js UI レイヤ(core へ一方向依存)
- テストオラクル: 価値反復の V\*/π\* を Bellman 残差の独立再計算で自己検証した上で、
  Q学習の収束判定(貪欲リターン=最適リターン)に用いる

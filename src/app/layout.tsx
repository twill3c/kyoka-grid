import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kyoka-grid — 強化学習グリッドワールド可視化",
  description:
    "Q学習エージェントが迷路を試行錯誤で学ぶ過程を、価値ヒートマップ・方策矢印・軌跡でリアルタイム可視化する教材アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

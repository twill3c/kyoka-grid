// フッタリンク(F-12)。育て方=操作説明・設計図はアーティファクト(要共有リンク)。

export interface FooterLink {
  label: string;
  href: string;
}

export const FOOTER_LINKS: readonly FooterLink[] = [
  {
    label: "MIT License",
    href: "https://github.com/twill3c/kyoka-grid/blob/main/LICENSE",
  },
  { label: "GitHub", href: "https://github.com/twill3c/kyoka-grid" },
  {
    label: "kyoka-grid の育て方",
    href: "https://claude.ai/code/artifact/ead1ef70-1da4-4602-988a-7c0fc55c93c8",
  },
  {
    label: "kyoka-grid 設計図",
    href: "https://claude.ai/code/artifact/4ad076b2-6bb7-4ef8-840f-7a5f25bbbded",
  },
  { label: "App Menu", href: "https://app-menu-amber.vercel.app" },
] as const;

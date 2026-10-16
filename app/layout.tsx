import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  verification: { google: "ijIpKKvz-NWbNtq5-czNdDyvsPV4WMoOhgjkCbFgWyU" },
  robots: { index: true, follow: true },
  title: "Block Action 復刻ラボ（クラシック版）",
  description: "原作者の許諾を得て公開しているBlock Actionの非公式復刻サイト。ステージを作り、保存し、リンクで共有。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026年度白宫严选中国F1硕博 · Checkmate",
  description: "中国大陆 F-1 公开样本的城市等待分布、月度趋势与匿名案例。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="checkmate-standalone-html">
      <body className="checkmate-standalone-body">{children}</body>
    </html>
  );
}

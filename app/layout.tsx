import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheckMate F1 China · Checkee 公开样本",
  description: "中国大陆 F-1 Checkee 公开样本的来源范围、地点分布和统计口径。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F-1 Visa Check 数据看板",
  description: "面向 F-1 签证行政审查经历者的匿名众包数据说明与参考。",
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Company · Phase 0 Demo",
  description:
    "一个面向业务 owner 的持续运转型数字内容增长团队产品原型。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

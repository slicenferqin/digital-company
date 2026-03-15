import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Company",
  description:
    "A persistent digital content growth team product for business owners."
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

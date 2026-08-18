import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/600.css";
import "@fontsource/noto-sans-kr/700.css";
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Lilyume",
  description: "로컬에서 안전하게 작성하고 A4 PDF로 인쇄하는 이력서 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}

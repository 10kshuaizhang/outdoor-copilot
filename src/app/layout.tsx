import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Serif_SC, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serifSc = Noto_Serif_SC({
  variable: "--font-serif-sc",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://outdoor-copilot.vercel.app",
  ),
  title: {
    default: "Outdoor Copilot · 个人户外智能",
    template: "%s · Outdoor Copilot",
  },
  description:
    "上传 GPX 或选用真实示例，得到对你的个人路线难度、时长区间与出发建议。Know the trail. Know yourself. Go smarter.",
  applicationName: "Outdoor Copilot",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "Outdoor Copilot · 个人户外智能",
    description: "先看清这条路对你有多难。",
    siteName: "Outdoor Copilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "Outdoor Copilot · 个人户外智能",
    description: "先看清这条路对你有多难。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1a241c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${display.variable} ${body.variable} ${serifSc.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

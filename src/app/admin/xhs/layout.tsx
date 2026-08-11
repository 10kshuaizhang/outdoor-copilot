import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "小红书封面制图",
  robots: { index: false, follow: false },
};

export default function AdminXhsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

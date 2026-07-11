import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Companio | Connect. Thrive. Together.",
  description: "The ultimate social platform for discovering communities, AI friends, and real-time connections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Новорічні Скарби",
  description: "Каталог вашої колекції новорічних іграшок.",
  icons: {
    icon: "/tree-logo.svg",
    apple: "/tree-logo.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Новорічні Скарби",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className="min-h-screen bg-cream font-body">{children}</body>
    </html>
  );
}

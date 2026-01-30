import type { Metadata, Viewport } from "next";
import { Martian_Mono } from "next/font/google";
import "./globals.css";

const martianMono = Martian_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Kansliet",
  description: "A brutalist web application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={martianMono.className}>
      <body>{children}</body>
    </html>
  );
}

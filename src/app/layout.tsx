import type { Metadata } from "next";
import { Martian_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";

const martianMono = Martian_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-martian-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kansliet.co"),
  title: {
    default: "Kansliet - Industrial Design Studio",
    template: "%s | Kansliet",
  },
  description:
    "Swedish design company specializing in industrial, spatial, and identity design. We create products, spaces, and brands with brutalist precision.",
  keywords: [
    "industrial design",
    "product design",
    "spatial design",
    "brand identity",
    "Swedish design",
    "brutalist design",
  ],
  authors: [{ name: "Kansliet" }],
  creator: "Kansliet",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kansliet.co",
    title: "Kansliet - Industrial Design Studio",
    description:
      "Swedish design company specializing in industrial, spatial, and identity design",
    siteName: "Kansliet",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kansliet Design Company",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kansliet - Industrial Design Studio",
    description:
      "Swedish design company specializing in industrial, spatial, and identity design",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={martianMono.className}>
      <body className="flex flex-col min-h-screen">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}

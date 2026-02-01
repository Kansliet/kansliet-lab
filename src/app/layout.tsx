import type { Metadata } from "next";
import { Martian_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google"; // <--- 1. IMPORT ADDED
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";
import { DossierStrip } from "@/components/dossier-strip";

const martianMono = Martian_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-martian-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kansliet.co"),
  title: {
    default: "KANSLIET (DESIGN COMPANY)",
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
    title: "KANSLIET (DESIGN COMPANY)",
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
    title: "KANSLIET (DESIGN COMPANY)",
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
  icons: {
    icon: "/kansliet-favicon.png", // Ensure this matches your file in public/
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
        <div className="sticky top-0 z-202 shrink-0 h-8 bg-background [--dossier-strip-height:2rem]">
          <DossierStrip />
        </div>
        <div className="flex flex-col flex-1 min-h-0">{children}</div>
        <CookieBanner />

        {/* 2. COMPONENT ADDED HERE */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      </body>
    </html>
  );
}

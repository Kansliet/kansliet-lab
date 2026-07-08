import type { Metadata, Viewport } from "next";
import { Martian_Mono } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";
import { DossierStrip } from "@/components/dossier-strip";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { SITE_URL } from "@/lib/site";

const martianMono = Martian_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-martian-mono",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "KANSLIET (DESIGN COMPANY)",
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
    url: SITE_URL,
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
  // Favicon: Next.js serves app/icon.png by default when present.
  // Add icons only if you need to override (e.g. icons: { icon: "/favicon.ico" }).
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Kansliet",
  alternateName: "Kansliet Design Company",
  legalName: "Kansliet Studio AB",
  url: SITE_URL,
  logo: `${SITE_URL}/kansliet-logo-navbar-web.svg`,
  description:
    "Swedish design company specializing in industrial, spatial, and identity design.",
  foundingDate: "2020",
  areaServed: ["SE", "EU", "US"],
  serviceType: [
    "Industrial Design",
    "Spatial Design",
    "Brand Identity",
    "3D Visualization",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "desk@kansliet.co",
    contactType: "customer service",
  },
  sameAs: [
    "https://instagram.com/kansliet.co",
    "https://www.linkedin.com/company/kansliet",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className={martianMono.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-300 focus:m-0 focus:p-4 focus:w-auto focus:h-auto focus:overflow-visible focus:whitespace-normal focus:bg-background focus:text-caps focus:text-sm focus:outline focus:ring-2 focus:ring-signal focus:border-0"
        >
          Skip to main content
        </a>
        <div className="sticky top-0 z-202 shrink-0 h-8 bg-background [--dossier-strip-height:2rem] [view-transition-name:dossier-strip]">
          <DossierStrip />
        </div>
        <ViewTransitions>
          <div className="flex flex-col flex-1 min-h-0">{children}</div>
        </ViewTransitions>
        <CookieBanner />
      </body>
      {gaId ? <AnalyticsConsent gaId={gaId} /> : null}
    </html>
  );
}

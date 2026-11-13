import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvreeality.com';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-VXHM9WXKHR';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Anv Reealty | Luxury Real Estate & Verified Properties in Pune",
    template: "%s | ANV REEALTY"
  },
  description: "Anv Reealty - Pune's premier luxury real estate advisory and verified buyer-seller marketplace for residential apartments, penthouses, and commercial spaces.",
  alternates: {
    canonical: './',
  },
  icons: {
    icon: "/LogoAnv-original.png",
    shortcut: "/LogoAnv-original.png",
    apple: "/LogoAnv-original.png",
  },
  openGraph: {
    title: "Anv Reealty | Luxury Real Estate & Verified Properties in Pune",
    description: "Pune's premier luxury real estate advisory and verified buyer-seller marketplace.",
    url: baseUrl,
    siteName: "ANV REEALTY",
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { PropertyComparisonProvider } from "@/context/PropertyComparisonContext";
import { SavedPropertiesProvider } from "@/context/SavedPropertiesContext";
import { FloatingCompareBar } from "@/components/public/FloatingCompareBar";
import { StickyAdsStrip } from "@/components/public/StickyAdsStrip";
import { TimedEnquiryModal } from "@/components/public/TimedEnquiryModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased w-full`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-h-full flex flex-col w-full max-w-full" suppressHydrationWarning>
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-tag-gtag"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        <SavedPropertiesProvider>
          <PropertyComparisonProvider>
            {children}
            <FloatingCompareBar />
            <StickyAdsStrip />
            <TimedEnquiryModal />
          </PropertyComparisonProvider>
        </SavedPropertiesProvider>
      </body>
    </html>
  );
}

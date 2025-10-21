import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Phone, Mail } from "iconoir-react";
import "@/app/globals.css";

import BrandLogo from "@/components/icons/BrandLogo";
import Navbar from "@/components/ui/Navbar";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL("https://kawsa-clinic-ecommerce.vercel.app"),
  title: {
    default: "Kawsa Clinic • Medibeauty & Skincare",
    template: "%s | Kawsa Clinic",
  },
  description:
    "Kawsa Clinic offers expert medibeauty and skincare in Johor Bahru. Shop our Gentle Exfoliating Gel Cleanser, Hydrating Serum, and Daily Sunscreen. Open Mon-Sat 9AM–6PM.",
  keywords: [
    "Kawsa Clinic",
    "Medibeauty Johor Bahru",
    "Skincare Products Malaysia",
    "Aesthetic Clinic Johor",
    "Gentle Exfoliating Cleanser",
    "Hydrating Serum",
    "Daily Sunscreen",
    "Hyaluronic Acid Skincare",
    "Dr Kay Medibeauty",
  ],
  authors: [
    { name: "Kawsa Clinic", url: "https://kawsa-clinic-ecommerce.vercel.app" },
  ],
  creator: "Kawsa Clinic",
  publisher: "Kawsa Clinic",
  category: "Medical Clinic",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: "https://kawsa-clinic-ecommerce.vercel.app",
    siteName: "Kawsa Clinic",
    title: "Kawsa Clinic • Medibeauty & Skincare",
    description:
      "Kawsa Clinic in Johor Bahru offers medibeauty services and premium skincare products like Gentle Exfoliating Gel Cleanser, Hydrating Serum, and Daily Sunscreen.",
    images: [
      {
        url: "https://kawsa-clinic-ecommerce.vercel.app/Images/banner.png",
        width: 1200,
        height: 630,
        alt: "Kawsa Clinic Skincare Products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@kawsaclinic",
    creator: "@kawsaclinic",
    title: "Kawsa Clinic • Medibeauty & Skincare",
    description:
      "Shop Kawsa Clinic’s skincare products in Johor Bahru: Gentle Exfoliating Gel Cleanser, Hydrating Serum, and Daily Sunscreen for glowing skin.",
    images: ["https://kawsa-clinic-ecommerce.vercel.app/Images/banner.png"],
  },
  alternates: {
    canonical: "https://kawsa-clinic-ecommerce.vercel.app",
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
    <html lang="en">
      <head>
        <Script
          id="ldjson-clinic"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalClinic",
            name: "Kawsa Clinic",
            image:
              "https://kawsa-clinic-ecommerce.vercel.app/Images/banner.png",
            url: "https://kawsa-clinic-ecommerce.vercel.app/",
            telephone: "+60182074771",
            address: {
              "@type": "PostalAddress",
              streetAddress: "39-02, Jalan Padi Emas 1/8, Bandar Baru Uda",
              addressLocality: "Johor Bahru",
              addressRegion: "Johor",
              postalCode: "81200",
              addressCountry: {
                "@type": "Country",
                name: "MY",
              },
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: 1.496141,
              longitude: 103.719517,
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
                opens: "09:00",
                closes: "22:00",
              },
            ],
            medicalSpecialty: ["Dermatology", "Aesthetic Medicine"],
            priceRange: "RM 100-500",
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+60182074771",
              contactType: "customer service",
              email: "drkay.skincare@gmail.com",
              availableLanguage: ["English", "Malay"],
            },
            sameAs: [
              "https://www.instagram.com/kawsaclinic/",
              "https://www.facebook.com/kawsaclinic/",
              "https://wasap.my/60138088912",
            ],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Skincare Products",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Product",
                    name: "Kawsa Gentle Exfoliating Gel Cleanser",
                    description:
                      "Lifts away dead skin and unclogs pores for a refreshed complexion.",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Product",
                    name: "Kawsa Hydrating Serum",
                    description:
                      "Provides deep hydration for glowing, healthy skin.",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Product",
                    name: "Kawsa Daily Sunscreen",
                    description:
                      "Protects your skin from harmful UV rays with daily use.",
                  },
                },
              ],
            },
          })}
        </Script>
      </head>
      <body className="relative antialiased overflow-x-hidden overflow-y-auto max-w-full bg-custom">
        <Navbar />
        <main className="w-full max-w-full">{children}</main>
        <footer className="p-0 sm:p-8">
          <div className="flex flex-col items-start justify-start p-6 sm:p-24 gap-8 sm:gap-16 rounded-none sm:rounded-4xl overflow-hidden text-violet-500 bg-violet-200">
            <div className="flex flex-col sm:flex-row gap-8 w-full justify-between">
              <div className="flex flex-col gap-8">
                <Link href="/">
                  <BrandLogo className="w-24 h-12 text-violet-900" />
                </Link>
                <p>DRKAY MEDIBEAUTY SDN BHD</p>
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://maps.app.goo.gl/vkQPXZCdxWLYwta7A"
                  className="text-violet-800 hover:underline"
                >
                  39-02, Jalan Padi Emas 1/8,
                  <br /> 81200 Bandar Baru Uda,
                  <br /> Johor Bahru, Johor
                </Link>
                <div className="flex gap-2 items-center">
                  <Phone className="w-5 h-5 text-violet-800" strokeWidth={2} />
                  <Link
                    href="tel:+60 18-2074771"
                    className="text-violet-800 hover:underline"
                  >
                    +60 18-2074771
                  </Link>
                  <p>/</p>
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://wasap.my/60138088912"
                    className="text-violet-800 hover:underline"
                  >
                    +60 13-8088912
                  </Link>
                </div>
                <div className="flex gap-2 items-center">
                  <Mail className="w-5 h-5 text-violet-800" strokeWidth={2} />
                  <Link
                    href="mailto:drkay.skincare@gmail.com"
                    className="text-violet-800 hover:underline"
                  >
                    drkay.skincare@gmail.com
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-8 sm:justify-between h-fit sm:h-64">
                <div className="flex flex-col gap-4">
                  <span className="font-semibold text-violet-900">Explore</span>
                  {siteConfig.footerItems
                    .filter(
                      (item) =>
                        item.category === "explore" && !item.status?.isHidden
                    )
                    .map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="text-violet-500 hover:text-violet-800"
                      >
                        {item.name}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row pt-4 gap-4 w-full justify-between">
              <div className="flex flex-wrap sm:flex-row gap-4 sm:gap-8">
                {siteConfig.footerItems
                  .filter(
                    (item) =>
                      item.category === "legal" && !item.status?.isHidden
                  )
                  .map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="text-violet-400 hover:text-violet-800"
                    >
                      {item.name}
                    </Link>
                  ))}
              </div>
              <span className="text-violet-400">
                © 2025 All rights reserved.
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

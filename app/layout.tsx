import type { Metadata } from "next";
import Link from "next/link";
import { Whatsapp, Mail } from "iconoir-react";
import "@/app/globals.css";

import BrandLogo from "@/components/icons/BrandLogo";
import Navbar from "@/components/ui/Navbar";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Kawsa Clinic",
  description: "Kawsa Clinic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative antialiased overflow-x-hidden overflow-y-auto bg-custom">
        <Navbar />
        <main>{children}</main>
        <footer className="flex flex-col items-start justify-start px-4 py-8 sm:p-24 gap-8 sm:gap-16 text-white bg-violet-950">
          <div className="flex flex-col sm:flex-row gap-8 w-full justify-between">
            <div className="flex flex-col gap-8">
              <Link href="/">
                <BrandLogo className="w-24 h-12 text-white" />
              </Link>
              <p>KAWSA CLINIC</p>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href="https://maps.app.goo.gl/vkQPXZCdxWLYwta7A"
                className="hover:underline"
              >
                No.7, Jalan Perjiranan 4/6
                <br /> Bandar Dato Onn
                <br /> 81100 Johor Bahru, Johor
              </Link>
              <div className="flex gap-2 items-center">
                <Whatsapp className="w-5 h-5" strokeWidth={2} />
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://wasap.my/60138088912"
                  className="hover:underline"
                >
                  +60 13-8088912
                </Link>
              </div>
              <div className="flex gap-2 items-center">
                <Mail className="w-5 h-5" strokeWidth={2} />
                <Link
                  href="mailto:kawsaclinic@gmail.com"
                  className="hover:underline"
                >
                  kawsaclinic@gmail.com
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-8 sm:justify-between h-fit sm:h-64">
              <div className="flex flex-col gap-4">
                <span className="font-semibold">Explore</span>
                {siteConfig.footerItems
                  .filter(
                    (item) =>
                      item.category === "explore" && !item.status?.isHidden
                  )
                  .map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="hover:text-violet-500"
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
                  (item) => item.category === "legal" && !item.status?.isHidden
                )
                .map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="text-white/30 hover:text-violet-200"
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
            <span className="text-white/30">
              © 2025 Kawsa. All rights reserved.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}

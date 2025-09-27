import type { Metadata } from "next";
import "@/app/globals.css";

import BrandLogo from "@/components/icons/BrandLogo";
import Navbar from "@/components/ui/Navbar";

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
        <footer>Footer</footer>
      </body>
    </html>
  );
}

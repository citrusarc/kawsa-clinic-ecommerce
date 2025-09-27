"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, Xmark, ShoppingBag } from "iconoir-react";
import clsx from "clsx";

import BrandLogo from "@/components/icons/BrandLogo";
import { siteConfig } from "@/config/site";

export default function Navbar() {
  const pathname = usePathname();
  const [scroll, setScroll] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  const navItems = siteConfig.navItems.filter((item) => !item.status?.isHidden);
  const isHome = pathname === "/";
  const isWhatCustomersSay = pathname === "what-customers-say";

  useEffect(() => {
    const handleScroll = () => {
      setScroll(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = openMenu ? "hidden" : "";
  }, [openMenu]);

  return (
    <nav
      className={clsx(
        "sticky top-0 z-50 flex p-4 sm:py-6 sm:px-24 w-full items-center justify-between",
        openMenu || !(isHome || isWhatCustomersSay)
          ? "text-black"
          : "text-black" // Change to text-white
      )}
    >
      <Link href="/" className="">
        <BrandLogo className="w-16 sm:w-24 h-8 sm:h-12" />
      </Link>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, Xmark, ShoppingBag } from "iconoir-react";
import clsx from "clsx";

import BrandLogo from "@/components/icons/BrandLogo";
import { siteConfig } from "@/config/site";

export default function Navbar() {
  const pathname = usePathname();
  // const [scroll, setScroll] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = siteConfig.navItems.filter((item) => !item.status?.isHidden);
  const isHome = pathname === "/";
  const isWhatCustomersSay = pathname === "/what-customers-say";

  // useEffect(() => {
  //   const handleScroll = () => {
  //     setScroll(window.scrollY > 50);
  //   };
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  useEffect(() => {
    document.body.style.overflow = openMenu ? "hidden" : "";
  }, [openMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    };
    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu]);

  return (
    <nav
      className={clsx(
        "sticky top-0 z-50 flex p-4 sm:py-4 sm:px-24 w-full items-center justify-between transition-colors duration-300",
        // openMenu
        //   ? "text-black bg-white"
        // : scroll
        // ? "text-white bg-violet-600"
        !(isHome || isWhatCustomersSay)
          ? "text-black bg-white"
          : "text-white bg-transparent"
      )}
    >
      <button onClick={() => setOpenMenu(!openMenu)}>
        {openMenu ? (
          <Xmark className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
      <Link href="/">
        <BrandLogo className="w-16 sm:w-24 h-8 sm:h-12" />
      </Link>
      <ShoppingBag className="w-6 h-6" />
      {openMenu && (
        <div
          ref={menuRef}
          className={clsx(
            "absolute top-full left-1/2 -translate-x-1/2 p-4 w-[94vw] max-w-[2400px] h-fit shadow-md rounded-2xl sm:rounded-4xl overflow-hidden backdrop-blur-2xl text-black bg-violet-100/80 transform transition-all duration-300 origin-top",
            openMenu
              ? "opacity-100 scale-y-100 pointer-events-auto"
              : "opacity-0 scale-y-0 pointer-events-none"
          )}
        >
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpenMenu(false)}
                className="p-4 w-fit rounded-2xl overflow-hidden text-xl hover:text-white hover:bg-violet-600"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

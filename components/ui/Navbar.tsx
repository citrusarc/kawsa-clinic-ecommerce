"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, Xmark, ShoppingBag } from "iconoir-react";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import BrandLogo from "@/components/icons/BrandLogo";
import { useCart } from "@/components/store/Cart";
import { Stepper } from "@/components/ui/Stepper";

export default function Navbar() {
  const pathname = usePathname();
  // const [scroll, setScroll] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const cartCount = useCart((state) => state.cartCount);
  const cartItems = useCart((state) => state.items);
  const [mounted, setMounted] = useState(false);

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
    document.body.style.overflow = openMenu || openCart ? "hidden" : "";
  }, [openMenu, openCart]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setOpenCart(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <button
        onClick={() => {
          setOpenMenu(!openMenu);
          setOpenCart(false);
        }}
      >
        {openMenu ? (
          <Xmark className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
      <Link href="/">
        <BrandLogo className="w-16 sm:w-24 h-8 sm:h-12" />
      </Link>
      <button
        onClick={() => {
          setOpenCart(!openCart);
          setOpenMenu(false);
        }}
        className="relative"
      >
        <ShoppingBag className="w-6 h-6" />
        <span className="absolute -top-2 -right-3  px-2 py-0.5 text-sm rounded-full text-white bg-violet-600 ">
          {mounted ? cartCount : 0}
        </span>
      </button>
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

      {mounted && openCart && (
        <div
          ref={cartRef}
          className={clsx(
            "absolute top-0 right-0 z-50 p-4 sm:p-8 w-full sm:w-[30vw] h-screen transform transition-transform duration-300 shadow-md backdrop-blur-2xl text-violet-600 bg-white",
            openCart ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="relative flex flex-col gap-4 sm:gap-8 w-full h-full overflow-hidden">
            <button
              onClick={() => setOpenCart(false)}
              className="absolute top-0 right-0"
            >
              <Xmark className="w-6 h-6 text-black" />
            </button>
            <h2 className="text-xl font-semibold">Your Cart</h2>
            {cartItems.length === 0 ? (
              <p className="text-neutral-400">Your cart is empty.</p>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100%-4rem)]">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex w-full items-center justify-between text-black"
                  >
                    <div className="flex w-full items-start gap-4">
                      <div className="relative flex-shrink-0 w-28 h-28 rounded-xl sm:rounded-2xl overflow-hidden">
                        <Image
                          fill
                          src={item.image}
                          alt={item.name}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col justify-between w-full">
                        <p className="font-medium line-clamp-2 break-words">
                          {item.name}
                        </p>
                        <div className="text-sm text-neutral-500">
                          <Stepper
                            value={item.quantity}
                            min={1}
                            onChange={
                              (newQty) =>
                                useCart
                                  .getState()
                                  .updateQuantity(item.id, newQty) // // use the new function
                            }
                          />
                        </div>
                        <p>RM {item.totalPrice}</p>
                      </div>
                    </div>
                    <button
                      className="text-red-500 ml-2 flex-shrink-0"
                      onClick={() => useCart.getState().clearItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

import { ItemStatus, NavItem, FooterItem } from "@/types";

export type SiteConfig = typeof siteConfig;

const defaultStatus: ItemStatus = {
  isDisabled: false,
  isHidden: false,
  isComingSoon: false,
};

export const siteConfig = {
  navItems: [
    {
      id: "shop-our-products",
      name: "Shop Our Products",
      href: "/shop-our-products",
      status: { ...defaultStatus },
    },
    {
      id: "our-story",
      name: "Our Story",
      href: "/our-story",
      status: { ...defaultStatus },
    },
    {
      id: "what-customers-say",
      name: "What Customers Say",
      href: "/what-customers-say",
      status: { ...defaultStatus },
    },
  ] satisfies NavItem[],
  footerItems: [
    {
      id: "shop-our-products",
      category: "explore",
      name: "Shop Our Products",
      href: "/shop-our-products",
      status: { ...defaultStatus },
    },
    {
      id: "our-story",
      category: "explore",
      name: "Our Story",
      href: "/our-story",
      status: { ...defaultStatus },
    },
    {
      id: "what-customers-say",
      category: "explore",
      name: "What Customers Say",
      href: "/what-customers-say",
      status: { ...defaultStatus },
    },
    {
      id: "terms-and-conditions",
      category: "legal",
      name: "Terms & Conditions",
      href: "/terms-and-conditions",
      status: { ...defaultStatus },
    },
    {
      id: "privacy-policy",
      category: "legal",
      name: "Privacy Policy",
      href: "/privacy-policy",
      status: { ...defaultStatus },
    },
    {
      id: "refund-policy",
      category: "legal",
      name: "Refund Policy",
      href: "/refund-policy",
      status: { ...defaultStatus },
    },
    {
      id: "shipping-policy",
      category: "legal",
      name: "Shipping Policy",
      href: "/shipping-policy",
      status: { ...defaultStatus },
    },
  ] satisfies FooterItem[],
};

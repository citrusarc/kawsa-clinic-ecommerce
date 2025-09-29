export type ItemStatus = {
  isDisabled?: boolean;
  isHidden?: boolean;
  isComingSoon?: boolean;
};

export type NavItem = {
  id: string;
  name: string;
  href?: string;
  target?: string;
  rel?: string;
  status?: ItemStatus;
};

export type FooterCategory = "explore";

export type FooterItem = {
  id: string;
  category: string;
  name: string;
  href?: string;
  target?: string;
  rel?: string;
  status?: ItemStatus;
};

export type ProductsItem = {
  id: string;
  src: string;
  alt: string;
  name: string;
  description?: string;
  additionalInfo1?: string;
  additionalInfo2?: string;
  currency: string;
  price: string;
};

export type IngredientsItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  position: string;
};

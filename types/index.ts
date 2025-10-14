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

export type FooterItem = {
  id: string;
  category: string;
  name: string;
  href?: string;
  target?: string;
  rel?: string;
  status?: ItemStatus;
};

export type VariantOption = {
  id: string;
  optionName: string;
  price: number;
  currency: string;
};

export type ProductVariant = {
  id: string;
  variantName: string;
  options: VariantOption[];
};

export type ProductsItem = {
  id: string;
  src: string;
  alt: string;
  name: string;
  description?: string[];
  additionalInfo1?: string[];
  additionalInfo2?: string[];
  currency: string;
  status?: ItemStatus;
  variants: ProductVariant[];
};

export type IngredientsItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string[];
  additionalInfo1?: string[];
  additionalInfo2?: string[];
  position: string;
};

export type TestimonialSet = {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
};

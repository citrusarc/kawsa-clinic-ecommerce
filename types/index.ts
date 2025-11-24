export type ItemStatus = {
  isDisabled?: boolean;
  isHidden?: boolean;
  isComingSoon?: boolean;
  isPromo?: boolean;
  isBestSeller?: boolean;
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
  currency: string;
  unitPrice: number;
  originalPrice?: number;
  currentPrice?: number;
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

export type TestimonialItem = {
  src: string;
  alt: string;
};

export type CartItem = {
  id: string;
  name: string;
  src: string;
  unitPrice: number;
  originalPrice?: number;
  currentPrice?: number;
  totalPrice: number;
  quantity: number;
  swiped?: boolean;
};

export type CartState = {
  items: CartItem[];
  setQuantity: (id: string, quantity: number) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearItem: (id: string) => void;
  cartCount: number;
  _swipeStartX: number;
  _isSwiping: boolean;
  startSwipe: (id: string, startX: number) => void;
  moveSwipe: (id: string, currentX: number) => void;
  endSwipe: (id: string) => void;
  resetSwipe: () => void;
};

export type CheckoutStore = {
  items: CartItem[];
  total: number;
  setCheckoutData: (items: CartItem[], total: number) => void;
  clearCheckout: () => void;
};

export type StepperProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
};

export type ToastProps = {
  title?: string;
  message: string;
  href?: string;
  CTA?: string;
  isOpen?: boolean;
  onClose?: () => void;
};

export type ToastType = "default" | "success" | "error";

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
  weight: number;
  width?: number;
  length?: number;
  height?: number;
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

export type ProductDetailsItem = {
  id: string;
  src: string;
  alt: string;
  name: string;
  description: string | string[];
  additionalInfo1: string | string[];
  additionalInfo2: string | string[];
  currency: string;
  status: {
    isHidden: boolean;
    isDisabled: boolean;
    isComingSoon: boolean;
    isPromo: boolean;
    isBestSeller: boolean;
  };
  product_variants: {
    id: string;
    variantName: string;
    variant_options: {
      id: string;
      optionName: string;
      weight: number;
      width?: number;
      length?: number;
      height?: number;
      currency: string;
      unitPrice: number;
      originalPrice?: number;
      currentPrice?: number;
    }[];
  }[];
};

export type ProductDetailsProps = {
  params: Promise<{ id: string }>;
};

export type GetProductsItem = {
  id: string;
  src: string;
  alt: string;
  name: string;
  description: string | string[];
  additionalInfo1: string | string[];
  additionalInfo2: string | string[];
  currency: string;
  status: { isHidden: boolean; isDisabled: boolean; isComingSoon: boolean };
  product_variants: {
    id: string;
    variantName: string;
    variant_options: {
      id: string;
      optionName: string;
      weight: number;
      width?: number;
      length?: number;
      height?: number;
      currency: string;
      unitPrice: number;
      originalPrice?: number;
      currentPrice?: number;
    }[];
  }[];
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

export type IngredientsDetailsPageProps = {
  params: {
    id: string;
  };
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
  productId: string;
  variantId: string;
  variantOptionId: string;
  name: string;
  src: string;
  weight: number;
  width?: number;
  length?: number;
  height?: number;
  unitPrice: number;
  originalPrice?: number;
  currentPrice?: number;
  quantity: number;
  subTotalPrice: number;
  totalPrice: number;
  swiped?: boolean;
};

export type CartState = {
  items: CartItem[];
  setQuantity: (id: string, quantity: number) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearItem: (id: string) => void;
  clearCart: () => void;
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
  subTotalPrice: number;
  shippingFee: number;
  totalPrice: number;
  setShippingFee: (fee: number) => void;
  setCheckoutData: (items: CartItem[], totalPrice: number) => void;
  clearCheckout: () => void;
};

export type RateCheckingItem = {
  rate_id: string;
  courier_name: string;
  service_id: string;
  service_name: string;
  shipment_price: number;
  addon_price: number;
  [key: string]: unknown;
};

export type OrderItem = {
  orderNumber: string;
  productId: string;
  variantId: string;
  variantOptionId: string;
  itemSrc: string;
  itemName: string;
  itemWeight: number;
  itemWidth: number;
  itemLength: number;
  itemHeight: number;
  itemCurrency: string;
  itemUnitPrice: number;
  itemQuantity: number;
  itemTotalPrice: number;
};

export type OrderBody = {
  fullName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: number;
  country: string;
  subTotalPrice: number;
  shippingFee: number;
  totalPrice: number;
  paymentMethod: string;
  easyparcel: {
    rateId?: string;
    serviceId: string;
    serviceName?: string;
    courierId?: string;
    courierName?: string;
  };
  items: OrderItem[];
};

export type OrderSuccessBody = {
  id: string;
  orderNumber: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: number;
  country: string;
  subTotalPrice: number;
  shippingFee: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  courierName: string;
  trackingUrl: string | null;
  awbNumber: string | null;
  deliveryStatus: string;
  orderStatus: string;
  orderWorkflowStatus: string;
  emailSent: boolean;
  order_items: OrderItem[];
};

export type EmailSendTrackingTemplateProps = {
  orderNumber: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  subTotalPrice: number;
  shippingFee: number;
  totalPrice: number;
  courierName: string;
  trackingUrl?: string | null;
  awbNumber?: string | null;
  deliveryStatus: string;
  orderStatus: string;
  items: OrderItem[];
};

export type EasyParcelRateItem = {
  rateId: string;
  serviceId: string;
  serviceName: string;
  courierId: string;
  courierName: string;
  shipmentTotalRates: number | string;
  deliveryDays?: string;
};

export type EasyParcelParcel = {
  parcelno: string;
  tracking_url: string;
  awb: string;
  awb_id_link: string;
};
export type EasyParcelResult = {
  messagenow: string;
  parcel: EasyParcelParcel[];
};
export type EasyParcelResponse = {
  api_status: string;
  error_remark?: string;
  result?: EasyParcelResult[];
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

import type {
  OrderStatus,
  FulfillmentStatus,
  PaymentStatus,
  OrderAddress,
  OrderItem,
  OrderMetadata,
  CustomerMetadata,
  DiscountRule,
} from "./db.types";

// --- Generic API Response ---
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// --- Store Config ---
export interface StoreConfig {
  stripeKey: string;
}

// --- Products ---
export interface ProductResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  is_preorder: boolean;
  weight: number;
  is_subscription: boolean;
  subscription_price: number | null;
}

// --- Orders ---
export interface CreateOrderRequest {
  items: { product_id: number; variant_id?: number; quantity: number }[];
  shipping_address: OrderAddress;
  billing_address?: OrderAddress;
  shipping_method: "relay" | "home";
  relay_code?: string;
  discount_code?: string;
}

export interface OrderResponse {
  id: number;
  display_id: number | null;
  email: string;
  items: OrderItem[];
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  payment_status: PaymentStatus;
  total: number;
  currency_code: string;
  shipping_address: OrderAddress | null;
  billing_address: OrderAddress | null;
  metadata: OrderMetadata | null;
  createdAt: Date;
}

// --- Customer ---
export interface CustomerResponse {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  has_account: boolean;
  metadata: CustomerMetadata | null;
}

export interface UpdateCustomerRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  metadata?: CustomerMetadata;
}

// --- Addresses ---
export interface CreateAddressRequest {
  label: string;
  first_name: string;
  last_name: string;
  street: string;
  street_complement?: string;
  zip_code: string;
  city: string;
  country?: string;
  phone?: string;
  is_default?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

// --- Discounts ---
export interface DiscountResponse {
  id: number;
  code: string;
  is_dynamic: boolean;
  rule: DiscountRule;
  is_disabled: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  usage_limit: number | null;
  usage_count: number;
}

export interface CreateDiscountRequest {
  code: string;
  rule: DiscountRule;
  is_dynamic?: boolean;
  starts_at?: string;
  ends_at?: string;
  usage_limit?: number;
}

// --- Contact ---
export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// --- Shipping ---
export interface ShippingRateRequest {
  weight: number;
  country: string;
}

export interface ShippingRate {
  method: string;
  price: number;
  label: string;
  estimated_days: string;
}

// --- Subscriptions ---
export interface CreateSubscriptionRequest {
  product_id: number;
  shipping_address: OrderAddress;
}

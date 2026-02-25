import { RowDataPacket } from "mysql2";

// --- Admins ---
export interface AdminRow extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Customers ---
export interface CustomerMetadata {
  address?: string;
  zip_code?: string;
  city?: string;
  phone?: string;
  stripe_customer_id?: string;
  subscription_schedule_id?: string;
  [key: string]: unknown;
}

export interface CustomerPreferences {
  literary_genres?: string[];
  favorite_authors?: string[];
  reading_pace?: "lent" | "normal" | "rapide";
}

export interface CustomerRow extends RowDataPacket {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  password: string;
  has_account: boolean;
  metadata: CustomerMetadata | null;
  preferences: CustomerPreferences | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- Products ---
export interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  is_preorder: boolean;
  weight: number;
  length: number;
  width: number;
  height: number;
  is_subscription: boolean;
  subscription_price: number | null;
  subscription_dates: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- Product Variants ---
export interface ProductVariantRow extends RowDataPacket {
  id: number;
  product_id: number;
  title: string;
  sku: string | null;
  inventory_quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

// --- Orders ---
export type OrderStatus =
  | "pending"
  | "completed"
  | "archived"
  | "canceled"
  | "requires_action";

export type FulfillmentStatus =
  | "not_fulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "partially_shipped"
  | "shipped"
  | "delivered"
  | "partially_returned"
  | "returned"
  | "canceled"
  | "requires_action";

export type PaymentStatus =
  | "not_paid"
  | "awaiting"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "canceled"
  | "requires_action";

export interface OrderAddress {
  first_name?: string;
  last_name?: string;
  street?: string;
  street_complement?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  phone?: string;
}

export interface OrderItem {
  product_id?: number;
  id?: number;
  variant_id?: number;
  name: string;
  quantity: number;
  price: number;
  unit_price?: number;
  total?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
}

export interface OrderMetadata {
  payment_intent_id?: string;
  tracking_number?: string;
  label_url?: string;
  shipping_method?: string;
  shipping_order_id?: string;
  notes?: string;
  discount_code?: string;
  discount_amount?: number;
  shipping_cost?: number;
  [key: string]: unknown;
}

export interface OrderRow extends RowDataPacket {
  id: number;
  display_id: number | null;
  cart_id: string | null;
  customer_id: number | null;
  email: string;
  billing_address: OrderAddress | null;
  shipping_address: OrderAddress | null;
  items: OrderItem[];
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  payment_status: PaymentStatus;
  total: number;
  currency_code: string;
  metadata: OrderMetadata | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- Contact Messages ---
export type ContactMessageStatus = "unread" | "read" | "replied";

export interface ContactMessageRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

// --- Carts ---
export interface CartItem {
  variant_id: number;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface CartContext {
  discount_code?: string;
  discount_amount?: number;
  [key: string]: unknown;
}

export interface CartRow extends RowDataPacket {
  id: string;
  customer_id: number | null;
  email: string | null;
  items: CartItem[];
  context: CartContext;
  completed_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- Discounts ---
export interface DiscountRule {
  type: "percentage" | "fixed";
  value: number;
}

export interface DiscountRow extends RowDataPacket {
  id: number;
  code: string;
  is_dynamic: boolean;
  rule: DiscountRule;
  is_disabled: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  usage_limit: number | null;
  usage_count: number;
  createdAt: Date;
  updatedAt: Date;
}

// --- Addresses ---
export interface AddressRow extends RowDataPacket {
  id: number;
  customer_id: number;
  label: string;
  first_name: string;
  last_name: string;
  street: string;
  street_complement: string | null;
  zip_code: string;
  city: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --- NextAuth tables ---
export interface AccountRow extends RowDataPacket {
  id: string;
  userId: number;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

export interface SessionRow extends RowDataPacket {
  id: string;
  sessionToken: string;
  userId: number;
  expires: Date;
}

export interface VerificationTokenRow extends RowDataPacket {
  identifier: string;
  token: string;
  expires: Date;
}

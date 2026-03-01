export const STATUS_COLOR_MAP: Record<
  string,
  "success" | "danger" | "warning" | "default"
> = {
  completed: "success",
  canceled: "danger",
  pending: "warning",
};

export const FULFILLMENT_COLOR_MAP: Record<
  string,
  "success" | "primary" | "secondary" | "default"
> = {
  delivered: "success",
  shipped: "primary",
  fulfilled: "secondary",
  not_fulfilled: "default",
};

export const PAYMENT_COLOR_MAP: Record<
  string,
  "success" | "warning" | "danger" | "default"
> = {
  captured: "success",
  refunded: "warning",
  not_paid: "danger",
};

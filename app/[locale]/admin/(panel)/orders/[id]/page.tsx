"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import OrderTimeline from "@/components/shared/OrderTimeline";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  street: string;
  zip_code: string;
  city: string;
  country: string;
  phone?: string;
  relay?: {
    code: string;
    name: string;
    address?: Record<string, string>;
  };
}

interface OrderNote {
  id: number;
  note: string;
  createdAt: string;
}

interface HistoryEntry {
  date: string;
  status: string;
  label?: string;
}

interface OrderMetadata {
  shipping_method?: string;
  shipping_cost?: number;
  shipping_order_id?: string;
  shipping_failed?: boolean;
  shipping_error?: string;
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  label_url?: string;
  relay_code?: string;
  promo_code?: string;
  discount_amount?: number;
  history?: HistoryEntry[];
  [key: string]: unknown;
}

interface Order {
  id: number;
  customer_email: string;
  email: string;
  total: number;
  status: string;
  fulfillment_status: string;
  payment_status: string;
  tracking_number?: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  notes: OrderNote[];
  metadata: OrderMetadata | null;
  createdAt: string;
}

const STATUS_COLOR_MAP: Record<
  string,
  "success" | "danger" | "warning" | "default"
> = {
  completed: "success",
  canceled: "danger",
  pending: "warning",
};

const FULFILLMENT_COLOR_MAP: Record<
  string,
  "success" | "primary" | "secondary" | "default"
> = {
  delivered: "success",
  shipped: "primary",
  fulfilled: "secondary",
  not_fulfilled: "default",
};

const PAYMENT_COLOR_MAP: Record<
  string,
  "success" | "warning" | "danger" | "default"
> = {
  captured: "success",
  refunded: "warning",
  not_paid: "danger",
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("admin");
  const st = useTranslations("status");
  const common = useTranslations("common");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "ship" | "reship" | "retry" | "refund";
    title: string;
    description: string;
    color: "primary" | "warning" | "danger";
    confirmLabel: string;
  } | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);

      if (res.ok) {
        setOrder(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const openConfirmModal = (
    type: "ship" | "reship" | "retry" | "refund",
    title: string,
    description: string,
    color: "primary" | "warning" | "danger",
    confirmLabel: string,
  ) => {
    setConfirmAction({ type, title, description, color, confirmLabel });
    onOpen();
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    onClose();
    const { type } = confirmAction;

    setConfirmAction(null);

    switch (type) {
      case "ship":
        await handleShip(false);
        break;
      case "retry":
        await handleShip(false);
        break;
      case "reship":
        await handleShip(true);
        break;
      case "refund":
        await handleRefund();
        break;
    }
  };

  const handleShip = async (force = false) => {
    setShipping(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/admin/orders/process-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(id), force }),
      });
      const data = await res.json();

      if (res.ok) {
        setActionSuccess(
          (force ? t("orders_shipping_reship") : t("orders_ship")) + " — OK",
        );
        await fetchOrder();
      } else {
        setActionError(data.message || data.error || "Erreur expédition");
      }
    } catch {
      setActionError("Erreur réseau");
    } finally {
      setShipping(false);
    }
  };

  const handleRefund = async () => {
    setRefunding(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/admin/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(id) }),
      });
      const data = await res.json();

      if (res.ok) {
        setActionSuccess(data.message || t("orders_refund") + " — OK");
        await fetchOrder();
      } else {
        setActionError(data.message || data.error || "Erreur remboursement");
      }
    } catch {
      setActionError("Erreur réseau");
    } finally {
      setRefunding(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      const res = await fetch("/api/admin/orders/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(id), noteId }),
      });

      if (res.ok) {
        await fetchOrder();
      }
    } catch {
      /* ignore */
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch("/api/admin/orders/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(id), note: newNote.trim() }),
      });

      if (res.ok) {
        setNewNote("");
        await fetchOrder();
      }
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-default-500 mb-4">{t("orders_not_found")}</p>
        <Button as={Link} color="primary" href="/admin/orders" variant="flat">
          {t("orders_back")}
        </Button>
      </div>
    );
  }

  const meta = order.metadata || {};
  const isRelay = meta.shipping_method === "relay";
  const relay = order.shipping_address?.relay;
  const history = (meta.history || []) as HistoryEntry[];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Button as={Link} href="/admin/orders" size="sm" variant="light">
        &larr; {t("orders_back")}
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
            {t("orders_detail_title", { id: `TSK-${order.id}` })}
          </h1>
          <p className="text-sm text-default-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString()} &mdash;{" "}
            {order.customer_email || order.email}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Chip
            color={STATUS_COLOR_MAP[order.status] || "default"}
            size="sm"
            variant="flat"
          >
            {st(order.status as "pending" | "completed" | "canceled")}
          </Chip>
          <Chip
            color={FULFILLMENT_COLOR_MAP[order.fulfillment_status] || "default"}
            size="sm"
            variant="flat"
          >
            {st(
              order.fulfillment_status as
                | "not_fulfilled"
                | "fulfilled"
                | "shipped"
                | "delivered",
            )}
          </Chip>
          <Chip
            color={PAYMENT_COLOR_MAP[order.payment_status] || "default"}
            size="sm"
            variant="flat"
          >
            {st(order.payment_status as "captured" | "refunded" | "not_paid")}
          </Chip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="admin-glass rounded-xl">
            <CardHeader>
              <h2 className="font-heading font-semibold text-lg">
                {t("orders_items")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {order.items.map((item, i) => (
                <div
                  key={item.id || i}
                  className="flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-default-500 ml-2">
                      x{item.quantity}
                    </span>
                  </div>
                  <span className="font-medium">
                    {/* A5: item.price already contains unit_price * quantity */}
                    {Number(item.price).toFixed(2)}
                    {common("currency")}
                  </span>
                </div>
              ))}
              <Divider />
              <div className="flex items-center justify-between text-lg font-bold">
                <span>{common("total")}</span>
                <span className="text-primary">
                  {Number(order.total).toFixed(2)}
                  {common("currency")}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <Card className="admin-glass rounded-xl">
            <CardHeader>
              <h2 className="font-heading font-semibold text-lg">
                {t("orders_actions")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {/* B2: Error / success feedback */}
              {actionError && (
                <div className="bg-danger-50 text-danger border border-danger-200 rounded-lg px-4 py-2 text-sm">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="bg-success-50 text-success border border-success-200 rounded-lg px-4 py-2 text-sm">
                  {actionSuccess}
                </div>
              )}
              {/* Shipping failure alert */}
              {meta.shipping_failed && (
                <div className="bg-danger-50 text-danger border border-danger-200 rounded-lg px-4 py-3 text-sm space-y-2">
                  <p className="font-semibold">{t("orders_shipping_failed")}</p>
                  {meta.shipping_error && (
                    <p className="text-xs opacity-80">
                      {meta.shipping_error as string}
                    </p>
                  )}
                </div>
              )}

              {(() => {
                const canShip =
                  (order.status === "completed" &&
                    order.fulfillment_status === "not_fulfilled" &&
                    order.payment_status === "captured") ||
                  !!meta.shipping_failed;
                const canReship =
                  order.fulfillment_status !== "not_fulfilled" &&
                  order.status !== "canceled" &&
                  !meta.shipping_failed;
                const canRefund = order.payment_status === "captured";
                const hasActions = canShip || canReship || canRefund;

                if (!hasActions) {
                  let messageKey = "orders_no_actions";

                  if (order.status === "pending") {
                    messageKey = "orders_no_actions_pending";
                  } else if (order.status === "canceled") {
                    messageKey =
                      order.payment_status === "refunded"
                        ? "orders_no_actions_refunded"
                        : "orders_no_actions_canceled";
                  } else if (order.fulfillment_status === "delivered") {
                    messageKey = "orders_no_actions_delivered";
                  }

                  return (
                    <p className="text-default-500 text-sm">
                      {t(messageKey as any)}
                    </p>
                  );
                }

                return (
                  <div className="flex flex-row gap-3 flex-wrap">
                    {canShip && (
                      <Button
                        color="primary"
                        isLoading={shipping}
                        variant="shadow"
                        onPress={() =>
                          meta.shipping_failed
                            ? openConfirmModal(
                                "retry",
                                t("orders_confirm_retry_title"),
                                t("orders_confirm_retry_desc"),
                                "primary",
                                common("confirm"),
                              )
                            : openConfirmModal(
                                "ship",
                                t("orders_confirm_ship_title"),
                                t("orders_confirm_ship_desc"),
                                "primary",
                                common("confirm"),
                              )
                        }
                      >
                        {meta.shipping_failed
                          ? t("orders_shipping_retry")
                          : t("orders_ship")}
                      </Button>
                    )}
                    {canReship && (
                      <Button
                        color="warning"
                        isLoading={shipping}
                        variant="flat"
                        onPress={() =>
                          openConfirmModal(
                            "reship",
                            t("orders_confirm_reship_title"),
                            t("orders_confirm_reship_desc"),
                            "warning",
                            common("confirm"),
                          )
                        }
                      >
                        {t("orders_shipping_reship")}
                      </Button>
                    )}
                    {canRefund && (
                      <Button
                        color="danger"
                        isLoading={refunding}
                        variant="flat"
                        onPress={() =>
                          openConfirmModal(
                            "refund",
                            t("orders_confirm_refund_title"),
                            t("orders_confirm_refund_desc"),
                            "danger",
                            common("confirm"),
                          )
                        }
                      >
                        {t("orders_refund")}
                      </Button>
                    )}
                  </div>
                );
              })()}
            </CardBody>
          </Card>

          {/* History */}
          <Card className="admin-glass rounded-xl">
            <CardHeader>
              <h2 className="font-heading font-semibold text-lg">
                {t("orders_shipping_history")}
              </h2>
            </CardHeader>
            <CardBody>
              <OrderTimeline history={history} />
            </CardBody>
          </Card>

          {/* Notes */}
          <Card className="admin-glass rounded-xl">
            <CardHeader>
              <h2 className="font-heading font-semibold text-lg">
                {t("orders_notes")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {order.notes && order.notes.length > 0 ? (
                <div className="space-y-3">
                  {order.notes.map((note, i) => (
                    <div
                      key={note.id || i}
                      className="bg-default-50 rounded-lg p-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm">{note.note}</p>
                        <Button
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => handleDeleteNote(note.id)}
                        >
                          {common("delete")}
                        </Button>
                      </div>
                      <p className="text-xs text-default-400 mt-1">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-default-500 text-sm">
                  {t("orders_no_notes")}
                </p>
              )}

              <Divider />

              <div className="space-y-3">
                <Textarea
                  minRows={2}
                  placeholder={t("orders_note_placeholder")}
                  value={newNote}
                  onValueChange={setNewNote}
                />
                <Button
                  color="primary"
                  isDisabled={!newNote.trim()}
                  isLoading={addingNote}
                  size="sm"
                  variant="flat"
                  onPress={handleAddNote}
                >
                  {t("orders_add_note")}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping address */}
          <Card className="admin-glass rounded-xl">
            <CardHeader>
              <h2 className="font-heading font-semibold text-lg">
                {t("orders_shipping_address")}
              </h2>
            </CardHeader>
            <CardBody>
              {order.shipping_address ? (
                <div className="text-sm text-default-600 space-y-1">
                  <p className="font-medium text-foreground">
                    {order.shipping_address.first_name}{" "}
                    {order.shipping_address.last_name}
                  </p>
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.zip_code}{" "}
                    {order.shipping_address.city}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  {order.shipping_address.phone && (
                    <p>{order.shipping_address.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-default-500 text-sm">
                  {t("orders_no_address")}
                </p>
              )}
            </CardBody>
          </Card>

          {/* C1: Shipping info */}
          <Card className="admin-glass rounded-xl">
            <CardHeader>
              <h2 className="font-heading font-semibold text-lg">
                {t("orders_shipping_info")}
              </h2>
            </CardHeader>
            <CardBody>
              <div className="text-sm space-y-3">
                {/* Method + cost */}
                <div className="flex justify-between">
                  <span className="text-default-500">
                    {t("orders_shipping_method")}
                  </span>
                  <span className="font-medium">
                    {isRelay
                      ? t("orders_shipping_method_relay")
                      : t("orders_shipping_method_home")}
                  </span>
                </div>
                {meta.shipping_cost != null && (
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {t("orders_shipping_cost")}
                    </span>
                    <span className="font-medium">
                      {Number(meta.shipping_cost).toFixed(2)}
                      {common("currency")}
                    </span>
                  </div>
                )}

                {/* Carrier */}
                {meta.carrier && (
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {t("orders_shipping_carrier")}
                    </span>
                    <span className="font-medium">
                      {meta.carrier as string}
                    </span>
                  </div>
                )}

                {/* Relay point */}
                {isRelay && relay && (
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {t("orders_shipping_relay")}
                    </span>
                    <span className="font-medium text-right">
                      {relay.name}
                      {relay.code && (
                        <span className="text-default-400 ml-1">
                          ({relay.code})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Label URL */}
                {meta.label_url && (
                  <div>
                    <a
                      className="text-primary underline text-sm font-medium"
                      href={meta.label_url as string}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {t("orders_shipping_download_label")}
                    </a>
                  </div>
                )}

                {/* Tracking */}
                {meta.tracking_number && (
                  <>
                    <Divider />
                    <div>
                      <span className="text-default-500 block mb-1">
                        {t("orders_shipping_tracking")}
                      </span>
                      <p className="font-mono bg-default-100 rounded px-3 py-2">
                        {meta.tracking_number as string}
                      </p>
                    </div>
                    {meta.tracking_url && (
                      <a
                        className="text-primary underline text-sm font-medium"
                        href={meta.tracking_url as string}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {t("orders_shipping_track_link")}
                      </a>
                    )}
                  </>
                )}

                {/* Shipping order ID (fallback if no tracking_number yet) */}
                {!meta.tracking_number && meta.shipping_order_id && (
                  <>
                    <Divider />
                    <div className="flex justify-between">
                      <span className="text-default-500">ID expédition</span>
                      <span className="font-mono text-xs">
                        {meta.shipping_order_id as string}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* C1: Promo info */}
          {meta.promo_code && (
            <Card className="admin-glass rounded-xl">
              <CardHeader>
                <h2 className="font-heading font-semibold text-lg">
                  {t("orders_promo_info")}
                </h2>
              </CardHeader>
              <CardBody>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {t("orders_promo_code")}
                    </span>
                    <Chip size="sm" variant="flat">
                      {meta.promo_code as string}
                    </Chip>
                  </div>
                  {meta.discount_amount != null &&
                    Number(meta.discount_amount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-default-500">
                          {t("orders_promo_discount")}
                        </span>
                        <span className="font-medium text-danger">
                          -{Number(meta.discount_amount).toFixed(2)}
                          {common("currency")}
                        </span>
                      </div>
                    )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader>{confirmAction?.title}</ModalHeader>
              <ModalBody>
                <p className="text-default-600">{confirmAction?.description}</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onModalClose}>
                  {common("cancel")}
                </Button>
                <Button
                  color={confirmAction?.color ?? "primary"}
                  onPress={handleConfirm}
                >
                  {confirmAction?.confirmLabel}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

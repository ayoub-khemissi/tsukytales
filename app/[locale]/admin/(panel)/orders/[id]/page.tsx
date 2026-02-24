"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Textarea } from "@heroui/input";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

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
}

interface OrderNote {
  id: number;
  note: string;
  createdAt: string;
}

interface Order {
  id: number;
  customer_email: string;
  total: number;
  status: string;
  fulfillment_status: string;
  payment_status: string;
  tracking_number?: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  notes: OrderNote[];
  createdAt: string;
}

const STATUS_COLOR_MAP: Record<string, "success" | "danger" | "warning" | "default"> = {
  completed: "success",
  canceled: "danger",
  pending: "warning",
};

const FULFILLMENT_COLOR_MAP: Record<string, "success" | "primary" | "default"> = {
  delivered: "success",
  shipped: "primary",
  not_fulfilled: "default",
};

const PAYMENT_COLOR_MAP: Record<string, "success" | "warning" | "danger" | "default"> = {
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

  const handleShip = async () => {
    setShipping(true);
    try {
      const res = await fetch("/api/admin/orders/process-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(id) }),
      });
      if (res.ok) await fetchOrder();
    } finally {
      setShipping(false);
    }
  };

  const handleRefund = async () => {
    setRefunding(true);
    try {
      const res = await fetch("/api/admin/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(id) }),
      });
      if (res.ok) await fetchOrder();
    } finally {
      setRefunding(false);
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
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-default-500 mb-4">{t("orders_not_found")}</p>
        <Button as={Link} href="/admin/orders" variant="flat" color="primary">
          {t("orders_back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Button as={Link} href="/admin/orders" variant="light" size="sm">
        &larr; {t("orders_back")}
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("orders_detail_title", { id: `TSK-${order.id}` })}</h1>
          <p className="text-sm text-default-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString()} &mdash; {order.customer_email}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Chip size="sm" variant="flat" color={STATUS_COLOR_MAP[order.status] || "default"}>
            {st(order.status as "pending" | "completed" | "canceled")}
          </Chip>
          <Chip size="sm" variant="flat" color={FULFILLMENT_COLOR_MAP[order.fulfillment_status] || "default"}>
            {st(order.fulfillment_status as "not_fulfilled" | "shipped" | "delivered")}
          </Chip>
          <Chip size="sm" variant="flat" color={PAYMENT_COLOR_MAP[order.payment_status] || "default"}>
            {st(order.payment_status as "captured" | "refunded" | "not_paid")}
          </Chip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-divider">
            <CardHeader>
              <h2 className="font-semibold text-lg">{t("orders_items")}</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {order.items.map((item, i) => (
                <div key={item.id || i} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-default-500 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-medium">
                    {(Number(item.price) * item.quantity).toFixed(2)}{common("currency")}
                  </span>
                </div>
              ))}
              <Divider />
              <div className="flex items-center justify-between text-lg font-bold">
                <span>{common("total")}</span>
                <span className="text-primary">{Number(order.total).toFixed(2)}{common("currency")}</span>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <Card className="border border-divider">
            <CardHeader>
              <h2 className="font-semibold text-lg">{t("orders_actions")}</h2>
            </CardHeader>
            <CardBody className="flex flex-row gap-3 flex-wrap">
              {order.fulfillment_status === "not_fulfilled" && (
                <Button
                  color="primary"
                  variant="shadow"
                  isLoading={shipping}
                  onPress={handleShip}
                >
                  {t("orders_ship")}
                </Button>
              )}
              {order.payment_status === "captured" && (
                <Button
                  color="danger"
                  variant="flat"
                  isLoading={refunding}
                  onPress={handleRefund}
                >
                  {t("orders_refund")}
                </Button>
              )}
              {order.fulfillment_status !== "not_fulfilled" && order.payment_status !== "captured" && (
                <p className="text-default-500 text-sm">{t("orders_no_actions")}</p>
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          <Card className="border border-divider">
            <CardHeader>
              <h2 className="font-semibold text-lg">{t("orders_notes")}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {order.notes && order.notes.length > 0 ? (
                <div className="space-y-3">
                  {order.notes.map((note, i) => (
                    <div key={note.id || i} className="bg-default-50 rounded-lg p-3">
                      <p className="text-sm">{note.note}</p>
                      <p className="text-xs text-default-400 mt-1">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-default-500 text-sm">{t("orders_no_notes")}</p>
              )}

              <Divider />

              <div className="space-y-3">
                <Textarea
                  placeholder={t("orders_note_placeholder")}
                  value={newNote}
                  onValueChange={setNewNote}
                  minRows={2}
                />
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  isLoading={addingNote}
                  isDisabled={!newNote.trim()}
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
          <Card className="border border-divider">
            <CardHeader>
              <h2 className="font-semibold text-lg">{t("orders_shipping_address")}</h2>
            </CardHeader>
            <CardBody>
              {order.shipping_address ? (
                <div className="text-sm text-default-600 space-y-1">
                  <p className="font-medium text-foreground">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.zip_code} {order.shipping_address.city}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
                </div>
              ) : (
                <p className="text-default-500 text-sm">{t("orders_no_address")}</p>
              )}
            </CardBody>
          </Card>

          {/* Tracking */}
          {order.tracking_number && (
            <Card className="border border-divider">
              <CardHeader>
                <h2 className="font-semibold text-lg">{t("orders_tracking")}</h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm font-mono bg-default-100 rounded px-3 py-2">
                  {order.tracking_number}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

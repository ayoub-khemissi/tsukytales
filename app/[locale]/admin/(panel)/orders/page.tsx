"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { SearchIcon } from "@/components/icons";

interface Order {
  id: number;
  customer_email: string;
  total: number;
  status: string;
  fulfillment_status: string;
  payment_status: string;
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

export default function OrdersPage() {
  const t = useTranslations("admin");
  const st = useTranslations("status");
  const common = useTranslations("common");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / (data.limit || limit)));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/orders/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("orders_title")}</h1>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          isLoading={exporting}
          onPress={handleExport}
        >
          {t("orders_export")}
        </Button>
      </div>

      {/* Search */}
      <Input
        className="max-w-md"
        placeholder={t("orders_search")}
        startContent={<SearchIcon className="text-default-400" />}
        value={search}
        onValueChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        isClearable
        onClear={() => setSearch("")}
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-default-500 py-20">{t("orders_empty")}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider text-left text-default-500">
                  <th className="pb-3 pr-4 font-medium">{t("orders_col_id")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("orders_col_customer")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("orders_col_total")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("orders_col_status")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("orders_col_fulfillment")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("orders_col_payment")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("orders_col_date")}</th>
                  <th className="pb-3 font-medium">{t("orders_col_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-divider/50 hover:bg-default-50 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-primary font-medium hover:underline">
                        TSK-{order.id}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-default-600">{order.customer_email}</td>
                    <td className="py-3 pr-4 font-medium">
                      {Number(order.total).toFixed(2)}{common("currency")}
                    </td>
                    <td className="py-3 pr-4">
                      <Chip size="sm" variant="flat" color={STATUS_COLOR_MAP[order.status] || "default"}>
                        {st(order.status as "pending" | "completed" | "canceled")}
                      </Chip>
                    </td>
                    <td className="py-3 pr-4">
                      <Chip size="sm" variant="flat" color={FULFILLMENT_COLOR_MAP[order.fulfillment_status] || "default"}>
                        {st(order.fulfillment_status as "not_fulfilled" | "shipped" | "delivered")}
                      </Chip>
                    </td>
                    <td className="py-3 pr-4">
                      <Chip size="sm" variant="flat" color={PAYMENT_COLOR_MAP[order.payment_status] || "default"}>
                        {st(order.payment_status as "captured" | "refunded" | "not_paid")}
                      </Chip>
                    </td>
                    <td className="py-3 pr-4 text-default-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Button
                        as={Link}
                        href={`/admin/orders/${order.id}`}
                        size="sm"
                        variant="light"
                        color="primary"
                      >
                        {t("orders_view")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`}>
                <Card className="border border-divider hover:border-primary/50 transition-colors">
                  <CardBody className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">TSK-{order.id}</span>
                      <Chip size="sm" variant="flat" color={STATUS_COLOR_MAP[order.status] || "default"}>
                        {st(order.status as "pending" | "completed" | "canceled")}
                      </Chip>
                    </div>
                    <p className="text-sm text-default-600">{order.customer_email}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{Number(order.total).toFixed(2)}{common("currency")}</span>
                      <span className="text-xs text-default-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Chip size="sm" variant="flat" color={FULFILLMENT_COLOR_MAP[order.fulfillment_status] || "default"}>
                        {st(order.fulfillment_status as "not_fulfilled" | "shipped" | "delivered")}
                      </Chip>
                      <Chip size="sm" variant="flat" color={PAYMENT_COLOR_MAP[order.payment_status] || "default"}>
                        {st(order.payment_status as "captured" | "refunded" | "not_paid")}
                      </Chip>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                color="primary"
                showControls
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

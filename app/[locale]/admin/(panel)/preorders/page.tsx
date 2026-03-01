"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AdminTableFilters } from "@/components/admin/AdminTableFilters";
import {
  SortableColumn,
  type SortDirection,
} from "@/components/admin/SortableColumn";
import { downloadCSV } from "@/lib/utils/export-csv";

interface PreorderItem {
  product_id: number;
  product_name: string;
  quantity: number;
}

interface Preorder {
  id: string;
  order_number: string;
  customer_id: number | null;
  customer_email: string;
  customer_name: string | null;
  items: PreorderItem[];
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

const PAYMENT_COLOR_MAP: Record<
  string,
  "success" | "warning" | "danger" | "default"
> = {
  captured: "success",
  refunded: "warning",
  not_paid: "danger",
};

export default function PreordersPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const st = useTranslations("status");
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const limit = 20;

  const fetchPreorders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (fulfillmentFilter !== "all")
        params.set("fulfillment_status", fulfillmentFilter);
      if (sortBy && sortDirection) {
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortDirection);
      }

      const res = await fetch(`/api/admin/preorders?${params}`);
      const data = await res.json();

      setPreorders(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, fulfillmentFilter, sortBy, sortDirection]);

  useEffect(() => {
    fetchPreorders();
  }, [fetchPreorders]);

  const handleSort = (column: string, direction: SortDirection) => {
    setSortBy(direction ? column : null);
    setSortDirection(direction);
    setPage(1);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();

      params.set("limit", "10000");
      if (search) params.set("search", search);
      if (fulfillmentFilter !== "all")
        params.set("fulfillment_status", fulfillmentFilter);

      const res = await fetch(`/api/admin/preorders?${params}`);
      const data = await res.json();
      const items: Preorder[] = data.items || [];

      const headers = [
        t("preorders_order_number"),
        t("preorders_customer"),
        t("preorders_items"),
        t("preorders_total"),
        t("preorders_status"),
        t("preorders_payment_status"),
        t("preorders_date"),
      ];

      const rows = items.map((p) => [
        p.order_number,
        `${p.customer_email}${p.customer_name ? ` (${p.customer_name})` : ""}`,
        p.items.map((i) => `${i.product_name} x${i.quantity}`).join(", "),
        `${p.total.toFixed(2)}${common("currency")}`,
        st(p.status as any),
        st(p.payment_status as any),
        new Date(p.created_at).toLocaleDateString(),
      ]);

      downloadCSV(
        `precommandes-${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        rows,
      );
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
          {t("preorders_title")}
        </h1>
        <Button
          color="primary"
          isLoading={exporting}
          size="sm"
          variant="flat"
          onPress={handleExportCSV}
        >
          {t("export_csv")}
        </Button>
      </div>

      {/* Filters */}
      <AdminTableFilters
        filters={[
          {
            key: "fulfillment_status",
            label: t("preorders_filter_fulfillment"),
            options: [
              { key: "all", label: t("filter_all") },
              { key: "not_fulfilled", label: st("not_fulfilled") },
              { key: "shipped", label: st("shipped") },
              { key: "delivered", label: st("delivered") },
            ],
            value: fulfillmentFilter,
            onChange: (v) => {
              setFulfillmentFilter(v);
              setPage(1);
            },
          },
        ]}
        search={{
          value: search,
          placeholder: t("preorders_search"),
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
        }}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : preorders.length === 0 ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("preorders_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label={t("preorders_title")}>
              <TableHeader>
                <TableColumn>
                  <SortableColumn
                    column="order_number"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("preorders_order_number")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("preorders_customer")}</TableColumn>
                <TableColumn>{t("preorders_items")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="total"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("preorders_total")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("preorders_status")}</TableColumn>
                <TableColumn>{t("preorders_payment_status")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="created_at"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("preorders_date")}
                    onSort={handleSort}
                  />
                </TableColumn>
              </TableHeader>
              <TableBody>
                {preorders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        className="text-primary font-medium hover:underline"
                        href={`/admin/orders/${order.id}`}
                      >
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {order.customer_id ? (
                        <Link
                          className="hover:underline"
                          href={`/admin/customers/${order.customer_id}`}
                        >
                          <span className="text-primary font-medium">
                            {order.customer_email}
                          </span>
                          {order.customer_name && (
                            <p className="text-sm text-default-500">
                              {order.customer_name}
                            </p>
                          )}
                        </Link>
                      ) : (
                        <span className="font-medium">
                          {order.customer_email}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {order.items.map((item, i) => (
                          <Link
                            key={i}
                            className="text-sm text-primary hover:underline"
                            href={`/admin/products/${item.product_id}`}
                          >
                            {item.product_name} x{item.quantity}
                          </Link>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-default-500">
                      {order.total.toFixed(2)}
                      {common("currency")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          order.status === "delivered"
                            ? "success"
                            : order.status === "shipped"
                              ? "primary"
                              : "warning"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {st(order.status as any)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          PAYMENT_COLOR_MAP[order.payment_status] || "default"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {st(order.payment_status as any)}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-default-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                showControls
                color="primary"
                page={page}
                total={totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

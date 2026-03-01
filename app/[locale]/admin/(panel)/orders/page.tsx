"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Checkbox } from "@heroui/checkbox";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AdminTableFilters } from "@/components/admin/AdminTableFilters";
import {
  SortableColumn,
  type SortDirection,
} from "@/components/admin/SortableColumn";
import { downloadCSV } from "@/lib/utils/export-csv";

interface OrderShippingAddress {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface Order {
  id: number;
  customer_id: number | null;
  customer_email: string;
  email?: string;
  total: number;
  status: string;
  fulfillment_status: string;
  payment_status: string;
  shipping_address?: OrderShippingAddress | string | null;
  createdAt: string;
}

function parseShippingAddress(
  addr: OrderShippingAddress | string | null | undefined,
): OrderShippingAddress | null {
  if (!addr) return null;
  if (typeof addr === "string") {
    try {
      return JSON.parse(addr);
    } catch {
      return null;
    }
  }

  return addr;
}

const STATUS_COLOR_MAP: Record<
  string,
  "success" | "danger" | "warning" | "default"
> = {
  completed: "success",
  canceled: "danger",
  pending: "warning",
};

const FULFILLMENT_COLOR_MAP: Record<string, "success" | "primary" | "default"> =
  {
    delivered: "success",
    shipped: "primary",
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

export default function OrdersPage() {
  const t = useTranslations("admin");
  const st = useTranslations("status");
  const common = useTranslations("common");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkShipping, setBulkShipping] = useState(false);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const limit = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (fulfillmentFilter !== "all")
        params.set("fulfillment_status", fulfillmentFilter);
      if (paymentFilter !== "all") params.set("payment_status", paymentFilter);
      if (sortBy && sortDirection) {
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortDirection);
      }

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();

      setOrders(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / (data.limit || limit)));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    statusFilter,
    fulfillmentFilter,
    paymentFilter,
    sortBy,
    sortDirection,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();

      params.set("limit", "10000");
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (fulfillmentFilter !== "all")
        params.set("fulfillment_status", fulfillmentFilter);
      if (paymentFilter !== "all") params.set("payment_status", paymentFilter);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      const items: Order[] = data.items || [];

      const headers = [
        t("orders_col_id"),
        t("orders_col_customer"),
        t("orders_col_email"),
        t("orders_col_phone"),
        t("orders_col_total"),
        t("orders_col_status"),
        t("orders_col_fulfillment"),
        t("orders_col_payment"),
        t("orders_col_date"),
      ];

      const rows = items.map((o) => {
        const addr = parseShippingAddress(o.shipping_address);
        const name = [addr?.first_name, addr?.last_name]
          .filter(Boolean)
          .join(" ");

        return [
          `TSK-${o.id}`,
          name || "—",
          o.customer_email || o.email || "",
          addr?.phone || "",
          `${Number(o.total).toFixed(2)}${common("currency")}`,
          st(o.status as any),
          st(o.fulfillment_status as any),
          st(o.payment_status as any),
          new Date(o.createdAt).toLocaleDateString(),
        ];
      });

      downloadCSV(
        `commandes-${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        rows,
      );
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (column: string, direction: SortDirection) => {
    setSortBy(direction ? column : null);
    setSortDirection(direction);
    setPage(1);
  };

  const isEligibleForShipping = useCallback(
    (o: Order) =>
      o.status === "completed" &&
      o.fulfillment_status === "not_fulfilled" &&
      o.payment_status === "captured",
    [],
  );

  const eligibleIds = useMemo(
    () =>
      new Set(orders.filter(isEligibleForShipping).map((o) => String(o.id))),
    [orders, isEligibleForShipping],
  );

  const allEligibleSelected =
    eligibleIds.size > 0 &&
    Array.from(eligibleIds).every((id) => selectedKeys.has(id));

  const toggleAll = () => {
    if (allEligibleSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(eligibleIds));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedKeys);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedKeys(next);
  };

  const handleBulkShip = async () => {
    setBulkShipping(true);
    try {
      const orderIds = Array.from(selectedKeys).map(Number);
      const res = await fetch("/api/admin/orders/bulk-ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      const results: Array<{
        orderId: number;
        success: boolean;
        error?: string;
      }> = data.results || [];
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        addToast({
          title: t("orders_bulk_ship_success", { count: successCount }),
          color: "success",
        });
      } else {
        addToast({
          title: t("orders_bulk_ship_partial", {
            success: successCount,
            fail: failCount,
          }),
          color: "warning",
        });
      }

      setSelectedKeys(new Set());
      onClose();
      fetchOrders();
    } finally {
      setBulkShipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
          {t("orders_title")}
        </h1>
        <div className="flex gap-2">
          <Button
            color="primary"
            isLoading={exporting}
            size="sm"
            variant="flat"
            onPress={handleExportCSV}
          >
            {t("export_csv")}
          </Button>
          <Button
            color="primary"
            isDisabled={selectedKeys.size === 0}
            size="sm"
            onPress={onOpen}
          >
            {t("orders_ship_selected", { count: selectedKeys.size })}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AdminTableFilters
        filters={[
          {
            key: "status",
            label: t("orders_filter_status"),
            options: [
              { key: "all", label: t("filter_all") },
              { key: "pending", label: st("pending") },
              { key: "completed", label: st("completed") },
              { key: "canceled", label: st("canceled") },
            ],
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
          },
          {
            key: "fulfillment",
            label: t("orders_filter_fulfillment"),
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
          {
            key: "payment",
            label: t("orders_filter_payment"),
            options: [
              { key: "all", label: t("filter_all") },
              { key: "not_paid", label: st("not_paid") },
              { key: "captured", label: st("captured") },
              { key: "refunded", label: st("refunded") },
            ],
            value: paymentFilter,
            onChange: (v) => {
              setPaymentFilter(v);
              setPage(1);
            },
          },
        ]}
        search={{
          value: search,
          placeholder: t("orders_search"),
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
        }}
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("orders_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label={t("orders_title")}>
              <TableHeader>
                <TableColumn className="w-10">
                  {eligibleIds.size > 0 && (
                    <Checkbox
                      isIndeterminate={
                        selectedKeys.size > 0 && !allEligibleSelected
                      }
                      isSelected={allEligibleSelected}
                      onValueChange={toggleAll}
                    />
                  )}
                </TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="id"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("orders_col_id")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("orders_col_customer")}</TableColumn>
                <TableColumn>{t("orders_col_email")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="total"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("orders_col_total")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("orders_col_status")}</TableColumn>
                <TableColumn>{t("orders_col_fulfillment")}</TableColumn>
                <TableColumn>{t("orders_col_payment")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="createdAt"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("orders_col_date")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("orders_col_actions")}</TableColumn>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      {isEligibleForShipping(order) && (
                        <Checkbox
                          isSelected={selectedKeys.has(String(order.id))}
                          onValueChange={() => toggleOne(String(order.id))}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="text-primary font-medium hover:underline"
                        href={`/admin/orders/${order.id}`}
                      >
                        TSK-{order.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const addr = parseShippingAddress(
                          order.shipping_address,
                        );
                        const name = [addr?.first_name, addr?.last_name]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <div>
                            {order.customer_id ? (
                              <Link
                                className="text-primary font-medium hover:underline"
                                href={`/admin/customers/${order.customer_id}`}
                              >
                                {name || "—"}
                              </Link>
                            ) : (
                              <span className="font-medium">{name || "—"}</span>
                            )}
                            {addr?.phone && (
                              <p className="text-xs text-default-400">
                                {addr.phone}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-default-600">
                      {order.customer_email || order.email}
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(order.total).toFixed(2)}
                      {common("currency")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={STATUS_COLOR_MAP[order.status] || "default"}
                        size="sm"
                        variant="flat"
                      >
                        {st(order.status as any)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          FULFILLMENT_COLOR_MAP[order.fulfillment_status] ||
                          "default"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {st(order.fulfillment_status as any)}
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
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        as={Link}
                        color="primary"
                        href={`/admin/orders/${order.id}`}
                        size="sm"
                        variant="flat"
                      >
                        {t("orders_view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
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

      {/* Bulk ship confirmation modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader>{t("orders_confirm_bulk_ship_title")}</ModalHeader>
              <ModalBody>
                <p>
                  {t("orders_confirm_bulk_ship_desc", {
                    count: selectedKeys.size,
                  })}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onModalClose}>
                  {common("cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={bulkShipping}
                  onPress={handleBulkShip}
                >
                  {common("confirm")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

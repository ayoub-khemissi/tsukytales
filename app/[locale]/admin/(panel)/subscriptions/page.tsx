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

interface Subscription {
  id: string;
  customer_id: number | null;
  customer_email: string;
  customer_name: string | null;
  plan_name: string;
  status: string;
  stripe_status: string | null;
  stripe_dashboard_url: string | null;
  next_billing_date: string | null;
  cancel_at_period_end: boolean;
  orders_count: number;
  last_shipment_date: string | null;
  amount: number;
  total_spent: number;
  created_at: string;
}

const statusColorMap: Record<
  string,
  "success" | "danger" | "warning" | "default"
> = {
  active: "success",
  canceled: "danger",
  past_due: "warning",
  unpaid: "danger",
  incomplete: "warning",
};

export default function SubscriptionsPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const limit = 20;

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy && sortDirection) {
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortDirection);
      }

      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await res.json();

      setSubscriptions(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortDirection]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

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
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await res.json();
      const items: Subscription[] = data.items || [];

      const headers = [
        t("subscriptions_email"),
        t("subscriptions_customer"),
        t("subscriptions_plan"),
        common("total"),
        t("subscriptions_total_spent"),
        t("subscriptions_status"),
        t("subscriptions_created_at"),
        t("subscriptions_last_order"),
        "Stripe",
        t("subscriptions_next_billing"),
        t("subscriptions_deliveries"),
      ];

      const rows = items.map((s) => [
        s.customer_email,
        s.customer_name || "—",
        s.plan_name,
        `${s.amount.toFixed(2)}${common("currency")}`,
        `${s.total_spent.toFixed(2)}${common("currency")}`,
        t(`subscriptions_status_${s.status}` as any) +
          (s.cancel_at_period_end
            ? ` (${t("subscriptions_cancel_pending")})`
            : ""),
        new Date(s.created_at).toLocaleDateString(),
        s.last_shipment_date
          ? new Date(s.last_shipment_date).toLocaleDateString()
          : "—",
        s.stripe_status || "—",
        s.next_billing_date
          ? new Date(s.next_billing_date).toLocaleDateString()
          : "—",
        String(s.orders_count),
      ]);

      downloadCSV(
        `abonnements-${new Date().toISOString().slice(0, 10)}.csv`,
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
          {t("subscriptions_title")}
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
            key: "status",
            label: t("subscriptions_filter_status"),
            options: [
              { key: "all", label: t("filter_all") },
              { key: "active", label: t("subscriptions_status_active") },
              { key: "canceled", label: t("subscriptions_status_canceled") },
              { key: "past_due", label: t("subscriptions_status_past_due") },
            ],
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
          },
        ]}
        search={{
          value: search,
          placeholder: t("subscriptions_search"),
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
      ) : subscriptions.length === 0 ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("subscriptions_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label={t("subscriptions_title")}>
              <TableHeader>
                <TableColumn>
                  <SortableColumn
                    column="customer_email"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("subscriptions_email")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("subscriptions_plan")}</TableColumn>
                <TableColumn>{t("subscriptions_status")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="total_spent"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("subscriptions_total_spent")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="created_at"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("subscriptions_created_at")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("subscriptions_last_order")}</TableColumn>
                <TableColumn>Stripe</TableColumn>
                <TableColumn>{t("subscriptions_next_billing")}</TableColumn>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      {sub.customer_id ? (
                        <Link
                          className="hover:underline"
                          href={`/admin/customers/${sub.customer_id}`}
                        >
                          <span className="text-primary font-medium">
                            {sub.customer_email}
                          </span>
                          {sub.customer_name && (
                            <p className="text-sm text-default-500">
                              {sub.customer_name}
                            </p>
                          )}
                        </Link>
                      ) : (
                        <div>
                          <span className="font-medium">
                            {sub.customer_email}
                          </span>
                          {sub.customer_name && (
                            <p className="text-sm text-default-500">
                              {sub.customer_name}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span>{sub.plan_name}</span>
                        <p className="text-sm text-default-500">
                          {sub.amount.toFixed(2)}
                          {common("currency")} &middot; {sub.orders_count}{" "}
                          {t("subscriptions_deliveries")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Chip
                          color={statusColorMap[sub.status] || "default"}
                          size="sm"
                          variant="flat"
                        >
                          {t(`subscriptions_status_${sub.status}`)}
                        </Chip>
                        {sub.cancel_at_period_end && (
                          <Chip color="warning" size="sm" variant="flat">
                            {t("subscriptions_cancel_pending")}
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-default-500">
                      {sub.total_spent.toFixed(2)}
                      {common("currency")}
                    </TableCell>
                    <TableCell className="text-default-500">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-default-500">
                      {sub.last_shipment_date
                        ? new Date(sub.last_shipment_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {sub.stripe_status ? (
                        sub.stripe_dashboard_url ? (
                          <a
                            href={sub.stripe_dashboard_url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <Chip
                              className="cursor-pointer hover:opacity-80"
                              color={
                                statusColorMap[sub.stripe_status] || "default"
                              }
                              size="sm"
                              variant="dot"
                            >
                              {sub.stripe_status} ↗
                            </Chip>
                          </a>
                        ) : (
                          <Chip
                            color={
                              statusColorMap[sub.stripe_status] || "default"
                            }
                            size="sm"
                            variant="dot"
                          >
                            {sub.stripe_status}
                          </Chip>
                        )
                      ) : (
                        <span className="text-default-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-default-500">
                      {sub.next_billing_date
                        ? new Date(sub.next_billing_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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

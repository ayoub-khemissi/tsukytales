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

interface Customer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  has_account: boolean;
  metadata: {
    phone?: string;
    city?: string;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  orders_count: number;
  total_spent: number;
}

interface CustomersResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
}

export default function CustomersPage() {
  const t = useTranslations("admin");

  const common = useTranslations("common");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const limit = 20;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (accountFilter !== "all") params.set("has_account", accountFilter);
      if (sortBy && sortDirection) {
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortDirection);
      }

      const res = await fetch(`/api/admin/customers?${params}`);

      if (res.ok) {
        const data: CustomersResponse = await res.json();

        setCustomers(data.items || []);
        setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, accountFilter, sortBy, sortDirection]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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
      if (accountFilter !== "all") params.set("has_account", accountFilter);

      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      const items: Customer[] = data.items || [];

      const headers = [
        t("customers_name"),
        t("customers_email"),
        t("customers_filter_account"),
        t("customers_orders_count"),
        t("customers_total_spent"),
        t("customers_created"),
      ];

      const rows = items.map((c) => [
        [c.first_name, c.last_name].filter(Boolean).join(" ") || "—",
        c.email,
        c.has_account ? t("customers_account_yes") : t("customers_account_no"),
        String(c.orders_count ?? 0),
        `${Number(c.total_spent ?? 0).toFixed(2)}${common("currency")}`,
        new Date(c.createdAt).toLocaleDateString(),
      ]);

      downloadCSV(
        `clients-${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        rows,
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
          {t("customers_title")}
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
            key: "has_account",
            label: t("customers_filter_account"),
            options: [
              { key: "all", label: t("filter_all") },
              { key: "yes", label: t("customers_account_yes") },
              { key: "no", label: t("customers_account_no") },
            ],
            value: accountFilter,
            onChange: (v) => {
              setAccountFilter(v);
              setPage(1);
            },
          },
        ]}
        search={{
          value: search,
          placeholder: t("customers_search"),
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
      ) : customers.length === 0 ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("customers_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label={t("customers_title")}>
              <TableHeader>
                <TableColumn>{t("customers_name")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="email"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("customers_email")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("customers_filter_account")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="orders_count"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("customers_orders_count")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="total_spent"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("customers_total_spent")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="createdAt"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("customers_created")}
                    onSort={handleSort}
                  />
                </TableColumn>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        className="text-primary font-medium hover:underline"
                        href={`/admin/customers/${customer.id}`}
                      >
                        {[customer.first_name, customer.last_name]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </Link>
                      {customer.metadata?.city && (
                        <p className="text-xs text-default-400">
                          {customer.metadata.city}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-default-600">
                          {customer.email}
                        </span>
                        {customer.metadata?.phone && (
                          <p className="text-xs text-default-400">
                            {customer.metadata.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={customer.has_account ? "success" : "default"}
                        size="sm"
                        variant="dot"
                      >
                        {t(
                          customer.has_account
                            ? "customers_account_yes"
                            : "customers_account_no",
                        )}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip color="primary" size="sm" variant="flat">
                        {customer.orders_count ?? 0}
                      </Chip>
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(customer.total_spent ?? 0).toFixed(2)}
                      {common("currency")}
                    </TableCell>
                    <TableCell className="text-default-500">
                      {new Date(customer.createdAt).toLocaleDateString()}
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

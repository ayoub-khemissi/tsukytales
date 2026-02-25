"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { SearchIcon } from "@/components/icons";

interface Customer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: string;
  orders_count: number;
}

interface CustomersResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
}

export default function CustomersPage() {
  const t = useTranslations("admin");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/customers?${params}`);

      if (res.ok) {
        const data: CustomersResponse = await res.json();

        setCustomers(data.items || []);
        setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("customers_title")}</h1>
        <Input
          isClearable
          className="max-w-xs"
          placeholder={t("customers_search")}
          size="sm"
          startContent={<SearchIcon className="text-default-400" />}
          value={search}
          onClear={() => setSearch("")}
          onValueChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : customers.length === 0 ? (
        <Card className="border border-divider">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("customers_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-2 text-sm font-semibold text-default-500 border-b border-divider">
            <span>{t("customers_name")}</span>
            <span>{t("customers_email")}</span>
            <span className="text-center">{t("customers_orders_count")}</span>
            <span className="text-right">{t("customers_created")}</span>
          </div>

          {/* Customer rows */}
          <div className="space-y-2">
            {customers.map((customer) => (
              <Link key={customer.id} href={`/admin/customers/${customer.id}`}>
                <Card className="border border-divider hover:border-primary/50 transition-colors cursor-pointer">
                  <CardBody className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-2 md:gap-4 items-center">
                      {/* Name */}
                      <div>
                        <span className="font-semibold text-foreground">
                          {[customer.first_name, customer.last_name]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="text-sm text-default-600">
                        {customer.email}
                      </div>

                      {/* Orders count */}
                      <div className="md:text-center">
                        <Chip color="primary" size="sm" variant="flat">
                          {customer.orders_count ?? 0}{" "}
                          {t("customers_orders_count").toLowerCase()}
                        </Chip>
                      </div>

                      {/* Created date */}
                      <div className="text-sm text-default-500 md:text-right">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
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

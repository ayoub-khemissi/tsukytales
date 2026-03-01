"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { Link } from "@/i18n/navigation";

interface Customer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  has_account: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: {
    phone?: string;
    city?: string;
    address?: string;
    zip_code?: string;
    [key: string]: unknown;
  } | null;
  orders?: Order[];
  addresses?: Address[];
  totalSpent?: string;
}

interface Order {
  id: number;
  total: number;
  status: string;
  fulfillment_status: string;
  payment_status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
}

interface Address {
  id: number;
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
}

export default function CustomerDetailPage() {
  const t = useTranslations("admin");
  const st = useTranslations("status");
  const common = useTranslations("common");
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);

      if (res.ok) {
        const data: Customer = await res.json();

        setCustomer(data);
        setOrders(data.orders || []);
        setAddresses(data.addresses || []);
      }
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-default-500 mb-4">{common("no_results")}</p>
        <Link href="/admin/customers">
          <Button color="primary" variant="flat">
            {common("back")}
          </Button>
        </Link>
      </div>
    );
  }

  const fullName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/admin/customers">
        <Button
          size="sm"
          startContent={
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          }
          variant="light"
        >
          {common("back")}
        </Button>
      </Link>

      {/* Title */}
      <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
        {t("customers_detail_title")}
      </h1>

      {/* Customer info card */}
      <Card className="admin-glass rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-heading font-semibold text-lg">{fullName}</h2>
          <Chip
            color={customer.has_account ? "primary" : "default"}
            size="sm"
            variant="flat"
          >
            {t(
              customer.has_account
                ? "customers_account_yes"
                : "customers_account_no",
            )}
          </Chip>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-default-500">{t("customers_email")}</p>
              <p className="font-medium">{customer.email}</p>
            </div>
            {customer.metadata?.phone && (
              <div>
                <p className="text-sm text-default-500">
                  {t("customers_detail_phone")}
                </p>
                <p className="font-medium">{customer.metadata.phone}</p>
              </div>
            )}
            {customer.metadata?.city && (
              <div>
                <p className="text-sm text-default-500">
                  {t("customers_detail_city")}
                </p>
                <p className="font-medium">
                  {[
                    customer.metadata.address,
                    customer.metadata.zip_code,
                    customer.metadata.city,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-default-500">
                {t("customers_detail_total_spent")}
              </p>
              <p className="font-medium text-primary">
                {Number(customer.totalSpent || 0).toFixed(2)}
                {common("currency")}
              </p>
            </div>
            <div>
              <p className="text-sm text-default-500">
                {t("customers_detail_orders_count", {
                  count: orders.length,
                })}
              </p>
              <p className="font-medium">{orders.length}</p>
            </div>
            <div>
              <p className="text-sm text-default-500">
                {t("customers_created")}
              </p>
              <p className="font-medium">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
            {customer.updatedAt &&
              customer.updatedAt !== customer.createdAt && (
                <div>
                  <p className="text-sm text-default-500">
                    {t("customers_detail_updated")}
                  </p>
                  <p className="font-medium">
                    {new Date(customer.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
          </div>
        </CardBody>
      </Card>

      {/* Orders */}
      <Card className="admin-glass rounded-xl">
        <CardHeader>
          <h2 className="font-heading font-semibold text-lg">
            {t("customers_detail_orders")}
          </h2>
        </CardHeader>
        <CardBody>
          {orders.length === 0 ? (
            <p className="text-default-500 text-center py-6">
              {t("orders_empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`}>
                  <Card className="admin-glass rounded-xl hover:shadow-lg transition-all cursor-pointer">
                    <CardBody className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">TSK-{order.id}</span>
                          <Chip
                            color={
                              order.status === "completed"
                                ? "success"
                                : order.status === "canceled"
                                  ? "danger"
                                  : "warning"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {st(
                              order.status as
                                | "pending"
                                | "completed"
                                | "canceled",
                            )}
                          </Chip>
                          <Chip size="sm" variant="flat">
                            {st(
                              order.fulfillment_status as
                                | "not_fulfilled"
                                | "shipped"
                                | "delivered",
                            )}
                          </Chip>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary">
                            {Number(order.total).toFixed(2)}
                            {common("currency")}
                          </span>
                          <span className="text-sm text-default-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <p className="text-sm text-default-500 mt-2">
                          {order.items.map((item, i) => (
                            <span key={i}>
                              {item.name} x{item.quantity}
                              {i < order.items.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Addresses */}
      <Card className="admin-glass rounded-xl">
        <CardHeader>
          <h2 className="font-heading font-semibold text-lg">
            {t("customers_detail_addresses")}
          </h2>
        </CardHeader>
        <CardBody>
          {addresses.length === 0 ? (
            <p className="text-default-500 text-center py-6">
              {t("customers_detail_no_addresses")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <Card key={addr.id} className="admin-glass rounded-xl">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{addr.label}</span>
                      {addr.is_default && (
                        <Chip color="primary" size="sm" variant="flat">
                          {t("customers_detail_default_address")}
                        </Chip>
                      )}
                    </div>
                    <p className="text-sm text-default-600">
                      {addr.first_name} {addr.last_name}
                      <br />
                      {addr.street}
                      {addr.street_complement && (
                        <>
                          <br />
                          {addr.street_complement}
                        </>
                      )}
                      <br />
                      {addr.zip_code} {addr.city}, {addr.country}
                      {addr.phone && (
                        <>
                          <br />
                          {addr.phone}
                        </>
                      )}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
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
  created_at: string;
  preferences: { literary_genres?: string[]; favorite_authors?: string[]; reading_pace?: string } | null;
  metadata: Record<string, unknown> | null;
  orders?: Order[];
  addresses?: Address[];
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
  zip_code: string;
  city: string;
  country: string;
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
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-default-500 mb-4">{common("no_results")}</p>
        <Link href="/admin/customers">
          <Button variant="flat" color="primary">{common("back")}</Button>
        </Link>
      </div>
    );
  }

  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/admin/customers">
        <Button variant="light" size="sm" startContent={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        }>
          {common("back")}
        </Button>
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-bold">{t("customers_detail_title")}</h1>

      {/* Customer info card */}
      <Card className="border border-divider">
        <CardHeader>
          <h2 className="font-semibold text-lg">{fullName}</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-default-500">{t("customers_email")}</p>
              <p className="font-medium">{customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-default-500">{t("customers_created")}</p>
              <p className="font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Preferences */}
          {customer.preferences && (
            <>
              <Divider />
              <div className="space-y-2">
                {customer.preferences.literary_genres && customer.preferences.literary_genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-sm text-default-500 mr-2">Genres:</span>
                    {customer.preferences.literary_genres.map((genre) => (
                      <Chip key={genre} size="sm" variant="flat">{genre}</Chip>
                    ))}
                  </div>
                )}
                {customer.preferences.favorite_authors && customer.preferences.favorite_authors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-sm text-default-500 mr-2">Authors:</span>
                    {customer.preferences.favorite_authors.map((author) => (
                      <Chip key={author} size="sm" variant="flat">{author}</Chip>
                    ))}
                  </div>
                )}
                {customer.preferences.reading_pace && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-default-500">Pace:</span>
                    <Chip size="sm" variant="flat" color="primary">{customer.preferences.reading_pace}</Chip>
                  </div>
                )}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Orders */}
      <Card className="border border-divider">
        <CardHeader>
          <h2 className="font-semibold text-lg">{t("customers_detail_orders")}</h2>
        </CardHeader>
        <CardBody>
          {orders.length === 0 ? (
            <p className="text-default-500 text-center py-6">{t("orders_empty")}</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`}>
                  <Card className="border border-divider hover:border-primary/50 transition-colors cursor-pointer">
                    <CardBody className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">TSK-{order.id}</span>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              order.status === "completed" ? "success" :
                              order.status === "canceled" ? "danger" : "warning"
                            }
                          >
                            {st(order.status as "pending" | "completed" | "canceled")}
                          </Chip>
                          <Chip size="sm" variant="flat">
                            {st(order.fulfillment_status as "not_fulfilled" | "shipped" | "delivered")}
                          </Chip>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary">
                            {Number(order.total).toFixed(2)}{common("currency")}
                          </span>
                          <span className="text-sm text-default-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <p className="text-sm text-default-500 mt-2">
                          {order.items.map((item, i) => (
                            <span key={i}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ", " : ""}</span>
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
      <Card className="border border-divider">
        <CardHeader>
          <h2 className="font-semibold text-lg">{t("customers_detail_addresses")}</h2>
        </CardHeader>
        <CardBody>
          {addresses.length === 0 ? (
            <p className="text-default-500 text-center py-6">{t("customers_empty")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <Card key={addr.id} className="border border-divider">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{addr.label}</span>
                      {addr.is_default && (
                        <Chip size="sm" color="primary" variant="flat">Default</Chip>
                      )}
                    </div>
                    <p className="text-sm text-default-600">
                      {addr.first_name} {addr.last_name}<br />
                      {addr.street}<br />
                      {addr.zip_code} {addr.city}, {addr.country}
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

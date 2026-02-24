"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";

interface CustomerProfile {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  metadata: Record<string, unknown> | null;
  preferences: {
    literary_genres?: string[];
    favorite_authors?: string[];
    reading_pace?: string;
  } | null;
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

export default function AccountPage() {
  const t = useTranslations("account");
  const nav = useTranslations("nav");
  const st = useTranslations("status");
  const common = useTranslations("common");
  const { data: session } = useSession();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, ordersRes, addressRes] = await Promise.all([
        fetch("/api/store/customer/me"),
        fetch("/api/store/orders/me"),
        fetch("/api/store/addresses/me"),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (ordersRes.ok) {
        const data = await ordersRes.json();

        setOrders(data.items || []);
      }
      if (addressRes.ok) setAddresses(await addressRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateProfile = async (data: Record<string, unknown>) => {
    setSaved(false);
    await fetch("/api/store/customer/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaved(true);
    fetchData();
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button
          color="danger"
          size="sm"
          variant="flat"
          onPress={() => signOut({ callbackUrl: "/" })}
        >
          {nav("logout")}
        </Button>
      </div>

      <Tabs
        aria-label="Account tabs"
        classNames={{ tabList: "gap-4 flex-wrap" }}
        color="primary"
        variant="underlined"
      >
        {/* Profile */}
        <Tab key="profile" title={t("tab_profile")}>
          <Card className="mt-4 border border-divider">
            <CardHeader>
              <h2 className="font-semibold text-lg">{t("profile_title")}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  defaultValue={profile?.first_name || ""}
                  label={t("tab_profile")}
                  onBlur={(e) => updateProfile({ first_name: e.target.value })}
                />
                <Input
                  defaultValue={profile?.last_name || ""}
                  label="Nom"
                  onBlur={(e) => updateProfile({ last_name: e.target.value })}
                />
              </div>
              <Input
                isReadOnly
                label="Email"
                value={profile?.email || session?.user?.email || ""}
              />
              {saved && (
                <p className="text-success text-sm">{t("profile_saved")}</p>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Orders */}
        <Tab key="orders" title={t("tab_orders")}>
          <div className="mt-4 space-y-4">
            {orders.length === 0 ? (
              <p className="text-default-500 py-10 text-center">
                {t("orders_empty")}
              </p>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="border border-divider">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        {t("order_number", { number: `TSK-${order.id}` })}
                      </span>
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
                          order.status as "pending" | "completed" | "canceled",
                        )}
                      </Chip>
                    </div>
                    <p className="text-sm text-default-500">
                      {t("order_date", {
                        date: new Date(order.createdAt).toLocaleDateString(),
                      })}
                    </p>
                    <div className="mt-2 text-sm">
                      {order.items?.map((item, i) => (
                        <span key={i}>
                          {item.name} x{item.quantity}
                          {i < order.items.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 font-bold text-primary">
                      {Number(order.total).toFixed(2)}
                      {common("currency")}
                    </div>
                    <Chip className="mt-2" size="sm" variant="flat">
                      {st(
                        order.fulfillment_status as
                          | "not_fulfilled"
                          | "shipped"
                          | "delivered",
                      )}
                    </Chip>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </Tab>

        {/* Addresses */}
        <Tab key="addresses" title={t("tab_addresses")}>
          <div className="mt-4 space-y-4">
            {addresses.length === 0 ? (
              <p className="text-default-500 py-10 text-center">
                {t("addresses_empty")}
              </p>
            ) : (
              addresses.map((addr) => (
                <Card key={addr.id} className="border border-divider">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{addr.label}</span>
                        {!!addr.is_default && (
                          <Chip
                            className="ml-2"
                            color="primary"
                            size="sm"
                            variant="flat"
                          >
                            {t("addresses_default")}
                          </Chip>
                        )}
                      </div>
                      <Button
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={async () => {
                          await fetch(`/api/store/addresses/${addr.id}`, {
                            method: "DELETE",
                          });
                          fetchData();
                        }}
                      >
                        {common("delete")}
                      </Button>
                    </div>
                    <p className="text-sm text-default-600 mt-1">
                      {addr.first_name} {addr.last_name}
                      <br />
                      {addr.street}
                      <br />
                      {addr.zip_code} {addr.city}, {addr.country}
                    </p>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </Tab>

        {/* Preferences */}
        <Tab key="preferences" title={t("tab_preferences")}>
          <Card className="mt-4 border border-divider">
            <CardHeader>
              <h2 className="font-semibold text-lg">
                {t("preferences_title")}
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                defaultValue={
                  profile?.preferences?.literary_genres?.join(", ") || ""
                }
                description="Fantasy, SF, Romance, Thriller..."
                label={t("preferences_genres")}
                onBlur={(e) => {
                  const genres = e.target.value
                    .split(",")
                    .map((g: string) => g.trim())
                    .filter(Boolean);

                  updateProfile({
                    preferences: {
                      ...profile?.preferences,
                      literary_genres: genres,
                    },
                  });
                }}
              />
              <Input
                defaultValue={
                  profile?.preferences?.favorite_authors?.join(", ") || ""
                }
                label={t("preferences_authors")}
                onBlur={(e) => {
                  const authors = e.target.value
                    .split(",")
                    .map((a: string) => a.trim())
                    .filter(Boolean);

                  updateProfile({
                    preferences: {
                      ...profile?.preferences,
                      favorite_authors: authors,
                    },
                  });
                }}
              />
              <Select
                defaultSelectedKeys={
                  profile?.preferences?.reading_pace
                    ? [profile.preferences.reading_pace]
                    : []
                }
                label={t("preferences_pace")}
                onSelectionChange={(keys) => {
                  const pace = Array.from(keys)[0] as string;

                  updateProfile({
                    preferences: {
                      ...profile?.preferences,
                      reading_pace: pace,
                    },
                  });
                }}
              >
                <SelectItem key="lent">{t("preferences_pace_slow")}</SelectItem>
                <SelectItem key="normal">
                  {t("preferences_pace_normal")}
                </SelectItem>
                <SelectItem key="rapide">
                  {t("preferences_pace_fast")}
                </SelectItem>
              </Select>
              {saved && (
                <p className="text-success text-sm">{t("preferences_saved")}</p>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}

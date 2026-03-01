"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Form } from "@heroui/form";
import { Tabs, Tab } from "@heroui/tabs";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBoxOpen,
  faMapMarkerAlt,
  faSignOutAlt,
  faSave,
  faTruck,
  faSyncAlt,
  faCalendarAlt,
  faForward,
  faUndo,
  faBan,
  faCreditCard,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

import PaymentMethodsTab from "@/components/account/payment-methods-tab";
import { Link } from "@/i18n/navigation";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";

interface CustomerProfile {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  metadata: Record<string, unknown> | null;
}

interface Order {
  id: number;
  total: number;
  status: string;
  fulfillment_status: string;
  payment_status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
  shipping_address: Record<string, unknown> | null;
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
  phone: string;
  is_default: boolean;
}

const TABS = [
  { key: "profile", icon: faUser },
  { key: "orders", icon: faBoxOpen },
  { key: "subscription", icon: faSyncAlt },
  { key: "payments", icon: faCreditCard },
  { key: "addresses", icon: faMapMarkerAlt },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface SubscriptionData {
  active: boolean;
  status?: string;
  product_name?: string;
  product_price?: number | null;
  shipping_cost?: number;
  total_per_quarter?: number;
  shipping_method?: string;
  skipped_phases?: string[];
  phases?: { start: string; end: string; skipped: boolean }[];
}

export default function AccountPage() {
  const t = useTranslations("account");
  const auth = useTranslations("auth");
  const nav = useTranslations("nav");
  const st = useTranslations("status");
  const common = useTranslations("common");
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabKeys = useMemo(() => TABS.map((t) => t.key), []);
  const paramTab = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey =
    paramTab && tabKeys.includes(paramTab) ? paramTab : "profile";
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [addressApiError, setAddressApiError] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
  });
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [skipLoading, setSkipLoading] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [skipMessage, setSkipMessage] = useState("");
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "",
    first_name: "",
    last_name: "",
    street: "",
    zip_code: "",
    city: "",
    country: "FR",
    phone: "",
    is_default: false,
  });

  useScrollReveal();

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, ordersRes, addressRes, subRes] = await Promise.all([
        fetch("/api/store/customer/me"),
        fetch("/api/store/orders/me"),
        fetch("/api/store/addresses/me"),
        fetch("/api/store/subscriptions/me"),
      ]);

      if (profileRes.ok) {
        const p = await profileRes.json();

        setProfile(p);
        setProfileForm({
          first_name: p.first_name || "",
          last_name: p.last_name || "",
        });
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();

        setOrders(data.items || []);
      }
      if (addressRes.ok) {
        const addrs: Address[] = await addressRes.json();

        // If only one address, ensure it's marked as default
        if (addrs.length === 1 && !addrs[0].is_default) {
          await fetch(`/api/store/addresses/${addrs[0].id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_default: true }),
          });
          addrs[0].is_default = true;
        }
        setAddresses(addrs);
      }
      if (subRes.ok) {
        const subData: SubscriptionData = await subRes.json();

        setSubscription(subData);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveProfile = async () => {
    setProfileSaved(false);

    const res = await fetch("/api/store/customer/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });

    if (!res.ok) return;
    setProfileSaved(true);
    await fetchData();
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const saveAddress = async (id: number) => {
    setAddressSaved(false);
    setAddressApiError(false);

    const res = await fetch(`/api/store/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressForm),
    });

    if (!res.ok) {
      setAddressApiError(true);
      setTimeout(() => setAddressApiError(false), 3000);

      return;
    }
    setAddressSaved(true);
    setEditingAddress(null);
    await fetchData();
    setTimeout(() => setAddressSaved(false), 3000);
  };

  const setDefaultAddress = async (id: number) => {
    setAddressSaved(false);
    setAddressApiError(false);
    const res = await fetch(`/api/store/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    });

    if (!res.ok) {
      setAddressApiError(true);
      setTimeout(() => setAddressApiError(false), 3000);

      return;
    }
    setAddressSaved(true);
    await fetchData();
    setTimeout(() => setAddressSaved(false), 3000);
  };

  const startEditingAddress = (addr: Address) => {
    setCreatingAddress(false);
    setEditingAddress(addr.id);
    setAddressForm({
      label: addr.label,
      first_name: addr.first_name,
      last_name: addr.last_name,
      street: addr.street,
      zip_code: addr.zip_code,
      city: addr.city,
      country: addr.country,
      phone: addr.phone || "",
      is_default: !!addr.is_default,
    });
  };

  const startCreatingAddress = () => {
    setEditingAddress(null);
    setCreatingAddress(true);
    setAddressForm({
      label: "",
      first_name: "",
      last_name: "",
      street: "",
      zip_code: "",
      city: "",
      country: "FR",
      phone: "",
      is_default: addresses.length === 0,
    });
  };

  const createAddress = async () => {
    setAddressSaved(false);
    setAddressApiError(false);

    const res = await fetch("/api/store/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressForm),
    });

    if (!res.ok) {
      setAddressApiError(true);
      setTimeout(() => setAddressApiError(false), 3000);

      return;
    }
    setAddressSaved(true);
    setCreatingAddress(false);
    await fetchData();
    setTimeout(() => setAddressSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  const tabLabel = (key: TabKey) =>
    t(
      `tab_${key}` as
        | "tab_profile"
        | "tab_orders"
        | "tab_subscription"
        | "tab_payments"
        | "tab_addresses",
    );

  const handleSkip = async (phaseDate: string) => {
    setSkipLoading(phaseDate);
    setSkipMessage("");
    try {
      const res = await fetch("/api/store/subscriptions/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase_date: phaseDate }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSkipMessage(data.error || t("subscription_skip_too_late"));
      } else {
        setSkipMessage(t("subscription_skip_confirm"));
        await fetchData();
      }
    } catch {
      setSkipMessage(t("subscription_skip_too_late"));
    } finally {
      setSkipLoading(null);
      setTimeout(() => setSkipMessage(""), 4000);
    }
  };

  const handleUnskip = async (phaseDate: string) => {
    setSkipLoading(phaseDate);
    setSkipMessage("");
    try {
      const res = await fetch("/api/store/subscriptions/unskip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase_date: phaseDate }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSkipMessage(data.error || t("subscription_skip_too_late"));
      } else {
        setSkipMessage(t("subscription_unskip_success"));
        await fetchData();
      }
    } catch {
      setSkipMessage(t("subscription_skip_too_late"));
    } finally {
      setSkipLoading(null);
      setTimeout(() => setSkipMessage(""), 4000);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm(t("subscription_cancel_confirm"))) return;
    try {
      await fetch("/api/store/subscriptions/cancel", { method: "POST" });
      await fetchData();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      {/* ========== HEADER ========== */}
      <div className="glass rounded-[24px] sm:rounded-[30px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-10 px-5 py-6 sm:px-10 sm:py-8">
        <div className="flex items-center gap-4">
          <Image
            alt="Tsuky Tales"
            className="shrink-0 rounded-full"
            height={56}
            src="/assets/img/logo-round.svg"
            width={56}
          />
          <div>
            <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
              {t.rich("title", {
                gold: (chunks) => <span className="magic-text">{chunks}</span>,
              })}
            </h1>
            <p className="text-sm text-text-light dark:text-gray-400">
              {profile?.email || session?.user?.email}
            </p>
          </div>
        </div>
        <Button
          className="text-danger w-full sm:w-auto"
          size="sm"
          startContent={<FontAwesomeIcon icon={faSignOutAlt} />}
          variant="light"
          onPress={() => signOut({ callbackUrl: "/" })}
        >
          {nav("logout")}
        </Button>
      </div>

      {/* ========== TABS ========== */}
      <div className="mb-8 overflow-x-auto scrollbar-hide -mx-6 px-6">
        <Tabs
          classNames={{ tabList: "gap-2" }}
          color="primary"
          selectedKey={activeTab}
          variant="light"
          onSelectionChange={(key) => {
            const params = new URLSearchParams(searchParams.toString());

            params.set("tab", key as string);
            router.replace(`${pathname}?${params.toString()}`, {
              scroll: false,
            });
          }}
        >
          {TABS.map(({ key, icon }) => (
            <Tab
              key={key}
              title={
                <div className="flex items-center gap-2.5">
                  <FontAwesomeIcon className="text-xs" icon={icon} />
                  {tabLabel(key)}
                </div>
              }
            />
          ))}
        </Tabs>
      </div>

      {/* ========== CONTENT ========== */}
      <div className="w-full">
        {/* Profile */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[30px] shadow-lg border border-[rgba(88,22,104,0.05)] px-5 py-6 sm:px-10 sm:py-10">
            <h2 className="font-heading italic text-xl font-bold text-text-brand dark:text-white mb-6">
              {t("profile_title")}
            </h2>
            <Form
              className="w-full flex flex-col items-stretch space-y-5"
              validationBehavior="native"
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile();
              }}
            >
              <Input
                isRequired
                className="w-full"
                label={auth("first_name")}
                maxLength={100}
                value={profileForm.first_name}
                onValueChange={(v) =>
                  setProfileForm((f) => ({ ...f, first_name: v }))
                }
              />
              <Input
                isRequired
                className="w-full"
                label={auth("last_name")}
                maxLength={100}
                value={profileForm.last_name}
                onValueChange={(v) =>
                  setProfileForm((f) => ({ ...f, last_name: v }))
                }
              />
              <Input
                isReadOnly
                className="w-full"
                label="Email"
                value={profile?.email || session?.user?.email || ""}
              />
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full"
                  color="primary"
                  startContent={<FontAwesomeIcon icon={faSave} />}
                  type="submit"
                >
                  {common("save")}
                </Button>
                {profileSaved && (
                  <span className="text-success text-sm font-medium text-center">
                    {t("profile_saved")}
                  </span>
                )}
              </div>
            </Form>
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[30px] shadow-lg border border-[rgba(88,22,104,0.05)] text-center px-5 py-12 sm:px-8 sm:py-16">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                  <FontAwesomeIcon icon={faBoxOpen} />
                </div>
                <p className="text-text-light dark:text-gray-400">
                  {t("orders_empty")}
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-900 rounded-[20px] sm:rounded-[24px] shadow-md border border-[rgba(88,22,104,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg px-4 py-5 sm:px-8 sm:py-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <span className="font-heading font-semibold text-text-brand dark:text-white">
                      {t("order_number", { number: `TSK-${order.id}` })}
                    </span>
                    <div className="flex items-center gap-2">
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
                      <Chip size="sm" variant="flat">
                        {st(
                          order.fulfillment_status as
                            | "not_fulfilled"
                            | "shipped"
                            | "delivered",
                        )}
                      </Chip>
                    </div>
                  </div>
                  <p className="text-sm text-text-light dark:text-gray-400 mb-2">
                    {t("order_date", {
                      date: new Date(order.createdAt).toLocaleDateString(),
                    })}
                  </p>
                  <div className="text-sm text-text-brand dark:text-gray-300 mb-3">
                    {order.items?.map((item, i) => (
                      <span key={i}>
                        {item.name} x{item.quantity}
                        {i < order.items.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                  {order.shipping_address && (
                    <div className="flex items-start gap-2 text-sm text-text-light dark:text-gray-400 mb-3">
                      <FontAwesomeIcon
                        className="mt-0.5 text-xs"
                        icon={faTruck}
                      />
                      <span>
                        {(order.shipping_address as Record<string, string>)
                          .relay ? (
                          <>
                            <span className="font-medium">
                              {t("order_relay")}
                            </span>
                            {" — "}
                            {
                              (order.shipping_address as Record<string, string>)
                                .relay
                            }
                          </>
                        ) : (
                          <>
                            <span className="font-medium">
                              {t("order_shipping_address")}
                            </span>
                            {" — "}
                            {
                              (order.shipping_address as Record<string, string>)
                                .street
                            }
                            {", "}
                            {
                              (order.shipping_address as Record<string, string>)
                                .zip_code
                            }{" "}
                            {
                              (order.shipping_address as Record<string, string>)
                                .city
                            }
                          </>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="font-heading font-bold text-lg text-primary">
                    {Number(order.total).toFixed(2)}
                    {common("currency")}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Subscription */}
        {activeTab === "subscription" && (
          <div className="space-y-4">
            {!subscription?.active ? (
              <div className="bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[30px] shadow-lg border border-[rgba(88,22,104,0.05)] text-center px-5 py-12 sm:px-8 sm:py-16">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                  <FontAwesomeIcon icon={faSyncAlt} />
                </div>
                <p className="text-text-light dark:text-gray-400 mb-4">
                  {t("subscription_none")}
                </p>
                <Button
                  as={Link}
                  className="btn-brand bg-primary font-semibold"
                  href="/subscription"
                  size="lg"
                >
                  {t("subscription_subscribe_cta")}
                </Button>
              </div>
            ) : (
              <>
                {/* Subscription info card */}
                <div className="bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[30px] shadow-lg border border-[rgba(88,22,104,0.05)] px-5 py-6 sm:px-10 sm:py-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FontAwesomeIcon icon={faSyncAlt} />
                    </div>
                    <h2 className="font-heading italic text-xl font-bold text-text-brand dark:text-white">
                      {t("subscription_title")}
                    </h2>
                    <Chip color="success" size="sm" variant="flat">
                      {t("subscription_active")}
                    </Chip>
                  </div>

                  {/* Product & pricing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-text-light dark:text-gray-400">
                        {t("subscription_product")}
                      </p>
                      <p className="font-semibold text-text-brand dark:text-white">
                        {subscription.product_name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-light dark:text-gray-400">
                        {t("subscription_price_label")}
                      </p>
                      <p className="font-semibold text-primary">
                        {subscription.total_per_quarter
                          ?.toFixed(2)
                          .replace(".", ",")}
                        {common("currency")}
                      </p>
                    </div>
                  </div>

                  {/* Upcoming dates */}
                  {subscription.phases && subscription.phases.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-text-light dark:text-gray-400 mb-3">
                        <FontAwesomeIcon
                          className="mr-2"
                          icon={faCalendarAlt}
                        />
                        {t("subscription_dates_label")}
                      </p>
                      <div className="space-y-2">
                        {subscription.phases!.slice(0, 4).map((phase) => {
                          const phaseDate = new Date(phase.start + "T00:00:00");
                          const isPast = phaseDate.getTime() < Date.now();
                          const isFuture24h =
                            phaseDate.getTime() > Date.now() + 24 * 3600 * 1000;

                          return (
                            <div
                              key={phase.start}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-bg-brand dark:bg-gray-800"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text-brand dark:text-white">
                                  {phaseDate.toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </span>
                                {phase.skipped ? (
                                  <Chip
                                    color="warning"
                                    size="sm"
                                    variant="flat"
                                  >
                                    {t("subscription_skipped_badge")}
                                  </Chip>
                                ) : isPast ? (
                                  <Chip
                                    color="default"
                                    size="sm"
                                    variant="flat"
                                  >
                                    {st("completed")}
                                  </Chip>
                                ) : (
                                  <Chip
                                    color="primary"
                                    size="sm"
                                    variant="flat"
                                  >
                                    {t("subscription_upcoming_badge")}
                                  </Chip>
                                )}
                              </div>
                              {/* Skip/unskip button – always same position */}
                              {phase.skipped && isFuture24h && (
                                <Button
                                  color="warning"
                                  isLoading={skipLoading === phase.start}
                                  size="sm"
                                  startContent={
                                    <FontAwesomeIcon icon={faUndo} />
                                  }
                                  variant="flat"
                                  onPress={() => handleUnskip(phase.start)}
                                >
                                  {t("subscription_unskip")}
                                </Button>
                              )}
                              {!phase.skipped && isFuture24h && (
                                <Button
                                  color="warning"
                                  isLoading={skipLoading === phase.start}
                                  size="sm"
                                  startContent={
                                    <FontAwesomeIcon icon={faForward} />
                                  }
                                  variant="flat"
                                  onPress={() => handleSkip(phase.start)}
                                >
                                  {t("subscription_skip")}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer: skip info + cancel */}
                  <div className="border-t border-primary/10 pt-6">
                    <Button
                      color="danger"
                      size="sm"
                      startContent={<FontAwesomeIcon icon={faBan} />}
                      variant="flat"
                      onPress={handleCancelSubscription}
                    >
                      {t("subscription_cancel")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Payments */}
        {activeTab === "payments" && <PaymentMethodsTab />}

        {/* Addresses */}
        {activeTab === "addresses" && (
          <div className="space-y-4">
            {addressSaved && (
              <div className="bg-success-50 text-success p-3 rounded-2xl text-sm font-medium">
                {t("addresses_saved")}
              </div>
            )}
            {addressApiError && (
              <div className="bg-danger-50 text-danger p-3 rounded-2xl text-sm font-medium">
                {t("addresses_error")}
              </div>
            )}

            {addresses.length < 3 && !creatingAddress && (
              <Button
                color="primary"
                startContent={<FontAwesomeIcon icon={faPlus} />}
                variant="flat"
                onPress={startCreatingAddress}
              >
                {t("addresses_add")}
              </Button>
            )}

            {creatingAddress && (
              <div className="bg-white dark:bg-gray-900 rounded-[20px] sm:rounded-[24px] shadow-md border border-[rgba(88,22,104,0.05)] px-4 py-5 sm:px-8 sm:py-6">
                <h3 className="font-heading font-semibold text-text-brand dark:text-white mb-4">
                  {t("addresses_add")}
                </h3>
                <Form
                  className="space-y-4 w-full overflow-hidden"
                  validationBehavior="native"
                  onSubmit={(e) => {
                    e.preventDefault();
                    createAddress();
                  }}
                >
                  <Input
                    isRequired
                    label={t("addresses_label")}
                    maxLength={50}
                    size="sm"
                    value={addressForm.label}
                    onValueChange={(v) =>
                      setAddressForm((f) => ({ ...f, label: v }))
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      isRequired
                      label={auth("first_name")}
                      maxLength={100}
                      size="sm"
                      value={addressForm.first_name}
                      onValueChange={(v) =>
                        setAddressForm((f) => ({ ...f, first_name: v }))
                      }
                    />
                    <Input
                      isRequired
                      label={auth("last_name")}
                      maxLength={100}
                      size="sm"
                      value={addressForm.last_name}
                      onValueChange={(v) =>
                        setAddressForm((f) => ({ ...f, last_name: v }))
                      }
                    />
                  </div>
                  <Input
                    isRequired
                    label={t("addresses_street")}
                    maxLength={255}
                    size="sm"
                    value={addressForm.street}
                    onValueChange={(v) =>
                      setAddressForm((f) => ({ ...f, street: v }))
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                    <Input
                      isRequired
                      label={t("addresses_zip_code")}
                      maxLength={10}
                      size="sm"
                      value={addressForm.zip_code}
                      onValueChange={(v) =>
                        setAddressForm((f) => ({ ...f, zip_code: v }))
                      }
                    />
                    <Input
                      isRequired
                      label={t("addresses_city")}
                      maxLength={100}
                      size="sm"
                      value={addressForm.city}
                      onValueChange={(v) =>
                        setAddressForm((f) => ({ ...f, city: v }))
                      }
                    />
                    <Input
                      isRequired
                      label={t("addresses_country")}
                      maxLength={2}
                      size="sm"
                      value={addressForm.country}
                      onValueChange={(v) =>
                        setAddressForm((f) => ({
                          ...f,
                          country: v.toUpperCase(),
                        }))
                      }
                    />
                  </div>
                  <Input
                    isRequired
                    label={t("addresses_phone")}
                    maxLength={20}
                    size="sm"
                    value={addressForm.phone}
                    onValueChange={(v) =>
                      setAddressForm((f) => ({ ...f, phone: v }))
                    }
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="w-full sm:w-auto"
                      color="primary"
                      size="sm"
                      startContent={<FontAwesomeIcon icon={faSave} />}
                      type="submit"
                    >
                      {common("save")}
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      size="sm"
                      variant="light"
                      onPress={() => setCreatingAddress(false)}
                    >
                      {common("cancel")}
                    </Button>
                  </div>
                </Form>
              </div>
            )}

            {addresses.length === 0 && !creatingAddress ? (
              <div className="bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[30px] shadow-lg border border-[rgba(88,22,104,0.05)] text-center px-5 py-12 sm:px-8 sm:py-16">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                </div>
                <p className="text-text-light dark:text-gray-400">
                  {t("addresses_empty")}
                </p>
              </div>
            ) : (
              <>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white dark:bg-gray-900 rounded-[20px] sm:rounded-[24px] shadow-md border border-[rgba(88,22,104,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg px-4 py-5 sm:px-8 sm:py-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm shrink-0">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                        </div>
                        <span className="font-semibold text-text-brand dark:text-white">
                          {addr.label}
                        </span>
                        {!!addr.is_default && (
                          <Chip color="primary" size="sm" variant="flat">
                            {t("addresses_default")}
                          </Chip>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                        {!addr.is_default && (
                          <Button
                            color="primary"
                            size="sm"
                            variant="flat"
                            onPress={() => setDefaultAddress(addr.id)}
                          >
                            {t("addresses_set_default")}
                          </Button>
                        )}
                        <Button
                          color="primary"
                          size="sm"
                          variant="light"
                          onPress={() => startEditingAddress(addr)}
                        >
                          {t("addresses_edit")}
                        </Button>
                        {addresses.length > 1 && !addr.is_default && (
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
                        )}
                      </div>
                    </div>

                    {editingAddress === addr.id ? (
                      <Form
                        className="mt-4 space-y-4 w-full overflow-hidden"
                        validationBehavior="native"
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveAddress(addr.id);
                        }}
                      >
                        <Input
                          isRequired
                          label={t("addresses_label")}
                          maxLength={50}
                          size="sm"
                          value={addressForm.label}
                          onValueChange={(v) =>
                            setAddressForm((f) => ({ ...f, label: v }))
                          }
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            isRequired
                            label={auth("first_name")}
                            maxLength={100}
                            size="sm"
                            value={addressForm.first_name}
                            onValueChange={(v) =>
                              setAddressForm((f) => ({ ...f, first_name: v }))
                            }
                          />
                          <Input
                            isRequired
                            label={auth("last_name")}
                            maxLength={100}
                            size="sm"
                            value={addressForm.last_name}
                            onValueChange={(v) =>
                              setAddressForm((f) => ({ ...f, last_name: v }))
                            }
                          />
                        </div>
                        <Input
                          isRequired
                          label={t("addresses_street")}
                          maxLength={255}
                          size="sm"
                          value={addressForm.street}
                          onValueChange={(v) =>
                            setAddressForm((f) => ({ ...f, street: v }))
                          }
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                          <Input
                            isRequired
                            label={t("addresses_zip_code")}
                            maxLength={10}
                            size="sm"
                            value={addressForm.zip_code}
                            onValueChange={(v) =>
                              setAddressForm((f) => ({ ...f, zip_code: v }))
                            }
                          />
                          <Input
                            isRequired
                            label={t("addresses_city")}
                            maxLength={100}
                            size="sm"
                            value={addressForm.city}
                            onValueChange={(v) =>
                              setAddressForm((f) => ({ ...f, city: v }))
                            }
                          />
                          <Input
                            isRequired
                            label={t("addresses_country")}
                            maxLength={2}
                            size="sm"
                            value={addressForm.country}
                            onValueChange={(v) =>
                              setAddressForm((f) => ({
                                ...f,
                                country: v.toUpperCase(),
                              }))
                            }
                          />
                        </div>
                        <Input
                          isRequired
                          label={t("addresses_phone")}
                          maxLength={20}
                          size="sm"
                          value={addressForm.phone}
                          onValueChange={(v) =>
                            setAddressForm((f) => ({ ...f, phone: v }))
                          }
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            className="w-full sm:w-auto"
                            color="primary"
                            size="sm"
                            startContent={<FontAwesomeIcon icon={faSave} />}
                            type="submit"
                          >
                            {common("save")}
                          </Button>
                          <Button
                            className="w-full sm:w-auto"
                            size="sm"
                            variant="light"
                            onPress={() => {
                              setEditingAddress(null);
                            }}
                          >
                            {common("cancel")}
                          </Button>
                        </div>
                      </Form>
                    ) : (
                      <p className="text-sm text-text-light dark:text-gray-400 sm:ml-12">
                        {addr.first_name} {addr.last_name}
                        <br />
                        {addr.street}
                        <br />
                        {addr.zip_code} {addr.city}, {addr.country}
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

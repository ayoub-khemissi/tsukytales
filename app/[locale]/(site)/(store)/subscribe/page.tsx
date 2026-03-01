"use client";

import type { RelayPoint } from "@/components/store/relay-picker";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Radio, RadioGroup } from "@heroui/radio";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Image from "next/image";
import dynamic from "next/dynamic";

import { Link, useRouter } from "@/i18n/navigation";

const RelayPicker = dynamic(() => import("@/components/store/relay-picker"), {
  ssr: false,
});

interface SavedAddress {
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

interface SubscriptionProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: string | null;
  description: string | null;
  is_subscription: boolean;
  subscription_price: number | null;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

function SetupForm({
  amount,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}) {
  const t = useTranslations("subscribe");
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const returnUrl = new URL(window.location.href);

    returnUrl.searchParams.set("confirming", "true");

    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: returnUrl.toString() },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || t("error_confirm"));
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <Form
      className="space-y-4"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <PaymentElement />
      {error && <p className="text-danger text-sm">{error}</p>}
      <Button
        className="btn-brand bg-primary w-full font-semibold"
        isDisabled={!stripe}
        isLoading={loading}
        size="lg"
        type="submit"
      >
        {t("pay_button", { amount: amount.toFixed(2) })}
      </Button>
    </Form>
  );
}

export default function SubscribePage() {
  const t = useTranslations("subscribe");
  const ct = useTranslations("checkout");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [product, setProduct] = useState<SubscriptionProduct | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [shippingMethod, setShippingMethod] = useState("relay");
  const [selectedRelay, setSelectedRelay] = useState<RelayPoint | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [address, setAddress] = useState({
    first_name: "",
    last_name: "",
    street: "",
    zip_code: "",
    city: "",
    country: "FR",
    phone: "",
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressMode, setAddressMode] = useState<string>("new");

  const [relayPrice, setRelayPrice] = useState(4.9);
  const [homePrice, setHomePrice] = useState(7.5);
  const [shippingCost, setShippingCost] = useState(4.9);
  const [totalPerQuarter, setTotalPerQuarter] = useState(0);

  // Auth guard
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/register?callbackUrl=/subscribe");
    }
  }, [sessionStatus, router]);

  // Load product
  useEffect(() => {
    fetch(`/api/store/products?subscription_page=true&locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        const items = data.items || [];

        setProduct(items[0] ?? null);
      })
      .finally(() => setProductLoading(false));
  }, [locale]);

  // Fetch saved addresses
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/store/addresses/me")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SavedAddress[]) => {
        setSavedAddresses(data);
        const defaultAddr = data.find((a) => a.is_default) || data[0];

        if (defaultAddr) {
          setAddressMode(String(defaultAddr.id));
          setAddress({
            first_name: defaultAddr.first_name,
            last_name: defaultAddr.last_name,
            street: defaultAddr.street,
            zip_code: defaultAddr.zip_code,
            city: defaultAddr.city,
            country: defaultAddr.country,
            phone: defaultAddr.phone || "",
          });
        }
      })
      .catch(() => {});
  }, [session?.user]);

  // Fetch shipping rates
  useEffect(() => {
    if (!product) return;
    const weight = Number(product.price > 0 ? 1.0 : 0.3);

    fetch(
      `/api/store/shipping/rates?weight=${weight}&country=${address.country}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setRelayPrice(data.relay?.price || 4.9);
        setHomePrice(data.home?.price || 7.5);
      })
      .catch(() => {});
  }, [product, address.country]);

  // Compute shipping cost and total
  useEffect(() => {
    const cost = shippingMethod === "relay" ? relayPrice : homePrice;

    setShippingCost(cost);
    if (product) {
      const price = product.subscription_price ?? product.price;

      setTotalPerQuarter(price + cost);
    }
  }, [shippingMethod, relayPrice, homePrice, product]);

  // Handle 3D Secure redirect
  const confirmSubscription = useCallback(
    async (siId: string) => {
      try {
        const res = await fetch("/api/store/subscriptions/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setup_intent_id: siId }),
        });

        if (!res.ok) {
          const data = await res.json();

          setOrderError(data.error || t("error_confirm"));

          return;
        }
        setSuccess(true);
      } catch {
        setOrderError(t("error_confirm"));
      }
    },
    [t],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("confirming") === "true") {
      const siId = params.get("setup_intent") || params.get("setup_intent_id");

      if (siId) {
        confirmSubscription(siId);
      }
    }
  }, [confirmSubscription]);

  const selectSavedAddress = (addrId: string) => {
    setAddressMode(addrId);
    if (addrId === "new") {
      setAddress({
        first_name: "",
        last_name: "",
        street: "",
        zip_code: "",
        city: "",
        country: "FR",
        phone: "",
      });

      return;
    }
    const addr = savedAddresses.find((a) => a.id === Number(addrId));

    if (addr) {
      setAddress({
        first_name: addr.first_name,
        last_name: addr.last_name,
        street: addr.street,
        zip_code: addr.zip_code,
        city: addr.city,
        country: addr.country,
        phone: addr.phone || "",
      });
    }
  };

  const handleShippingMethodChange = (value: string) => {
    setShippingMethod(value);
    if (value !== "relay") setSelectedRelay(null);
  };

  const createSubscription = async () => {
    if (shippingMethod === "relay" && !selectedRelay) {
      setOrderError(ct("relay_required"));

      return;
    }
    setLoading(true);
    setOrderError("");

    try {
      const shippingAddress =
        shippingMethod === "relay" && selectedRelay
          ? {
              ...address,
              relay: {
                code: selectedRelay.code,
                name: selectedRelay.name,
                network: "MONR_NETWORK",
                address: selectedRelay.address,
              },
            }
          : address;

      const res = await fetch("/api/store/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product!.id,
          shipping: {
            method: shippingMethod,
            country: address.country,
            shipping_address: shippingAddress,
            relay: selectedRelay
              ? {
                  code: selectedRelay.code,
                  name: selectedRelay.name,
                  network: "MONR_NETWORK",
                  address: selectedRelay.address,
                }
              : undefined,
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (
          data.error?.includes("déjà un abonnement") ||
          data.error?.includes("already")
        ) {
          setAlreadySubscribed(true);

          return;
        }
        throw new Error(data.error || t("error_subscription"));
      }
      setClientSecret(data.client_secret);
      setSetupIntentId(data.setup_intent_id);
      if (data.shipping_cost != null) setShippingCost(data.shipping_cost);
      if (data.total_per_quarter != null)
        setTotalPerQuarter(data.total_per_quarter);
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : t("error_subscription"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSuccess = () => {
    if (setupIntentId) {
      confirmSubscription(setupIntentId);
    } else {
      setSuccess(true);
    }
  };

  // Loading state
  if (sessionStatus === "loading" || productLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  // Already subscribed
  if (alreadySubscribed) {
    return (
      <div className="container mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">
          {t("already_subscribed_title")}
        </h1>
        <p className="text-default-600 mb-8">{t("already_subscribed_desc")}</p>
        <Button
          as={Link}
          className="btn-brand bg-primary w-full sm:w-auto font-semibold"
          href="/account?tab=subscription"
          size="lg"
        >
          {t("manage_subscription")}
        </Button>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="container mx-auto max-w-lg px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">{t("success_title")}</h1>
        <p className="text-default-600 mb-8">{t("success_message")}</p>
        <Button
          as={Link}
          className="btn-brand bg-primary w-full sm:w-auto font-semibold"
          href="/account?tab=subscription"
          size="lg"
        >
          {t("success_manage")}
        </Button>
      </div>
    );
  }

  // No product
  if (!product) {
    return (
      <div className="container mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-default-500 mb-4">{t("product_unavailable")}</p>
        <Button
          as={Link}
          className="btn-brand bg-primary w-full sm:w-auto font-semibold"
          href="/subscription"
          size="lg"
        >
          {common("back")}
        </Button>
      </div>
    );
  }

  const price = product.subscription_price ?? product.price;
  const updateAddress = (field: string) => (value: string) =>
    setAddress((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping method */}
          <Card className="border border-divider">
            <CardBody className="p-6">
              <h3 className="font-semibold mb-4">{ct("shipping_method")}</h3>
              <RadioGroup
                value={shippingMethod}
                onValueChange={handleShippingMethodChange}
              >
                <Radio value="relay">
                  {ct("shipping_relay")} —{" "}
                  {relayPrice.toFixed(2).replace(".", ",")}
                  {common("currency")}
                </Radio>
                <Radio value="home">
                  {ct("shipping_home")} —{" "}
                  {homePrice.toFixed(2).replace(".", ",")}
                  {common("currency")}
                </Radio>
              </RadioGroup>

              {shippingMethod === "relay" && (
                <>
                  <RelayPicker
                    country={address.country}
                    selectedRelay={selectedRelay}
                    onSelect={setSelectedRelay}
                  />
                  {selectedRelay && (
                    <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-sm font-medium text-success">
                        {ct("relay_select")} : {selectedRelay.name}
                      </p>
                      <p className="text-xs text-default-500">
                        {selectedRelay.address.street},{" "}
                        {selectedRelay.address.zipCode}{" "}
                        {selectedRelay.address.city}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>

          {/* Shipping address (only for home delivery) */}
          {shippingMethod === "home" && (
            <Card className="border border-divider">
              <CardBody className="p-6 space-y-4">
                <h3 className="font-semibold">{ct("shipping_address")}</h3>

                {session?.user && savedAddresses.length > 0 && (
                  <RadioGroup
                    label={ct("saved_addresses")}
                    value={addressMode}
                    onValueChange={selectSavedAddress}
                  >
                    {savedAddresses.map((addr) => (
                      <Radio key={addr.id} value={String(addr.id)}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{addr.label}</span>
                          {!!addr.is_default && (
                            <Chip color="primary" size="sm" variant="flat">
                              {ct("default_badge")}
                            </Chip>
                          )}
                        </div>
                        <span className="text-sm text-default-500">
                          {addr.first_name} {addr.last_name} — {addr.street},{" "}
                          {addr.zip_code} {addr.city}
                        </span>
                      </Radio>
                    ))}
                    <Radio value="new">{ct("new_address")}</Radio>
                  </RadioGroup>
                )}

                {(savedAddresses.length === 0 || addressMode === "new") && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        isRequired
                        label={
                          common("quantity") === "Quantité"
                            ? "Prénom"
                            : "First name"
                        }
                        value={address.first_name}
                        onValueChange={updateAddress("first_name")}
                      />
                      <Input
                        isRequired
                        label={
                          common("quantity") === "Quantité"
                            ? "Nom"
                            : "Last name"
                        }
                        value={address.last_name}
                        onValueChange={updateAddress("last_name")}
                      />
                    </div>
                    <Input
                      isRequired
                      label={
                        common("quantity") === "Quantité" ? "Adresse" : "Street"
                      }
                      value={address.street}
                      onValueChange={updateAddress("street")}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        isRequired
                        label={
                          common("quantity") === "Quantité"
                            ? "Code postal"
                            : "Zip code"
                        }
                        value={address.zip_code}
                        onValueChange={updateAddress("zip_code")}
                      />
                      <Input
                        isRequired
                        label={
                          common("quantity") === "Quantité" ? "Ville" : "City"
                        }
                        value={address.city}
                        onValueChange={updateAddress("city")}
                      />
                    </div>
                    <Input
                      isRequired
                      label={
                        common("quantity") === "Quantité"
                          ? "Téléphone"
                          : "Phone"
                      }
                      value={address.phone}
                      onValueChange={updateAddress("phone")}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Payment */}
          {clientSecret ? (
            <Card className="border border-divider">
              <CardBody className="p-6">
                <h3 className="font-semibold mb-4">{ct("payment_title")}</h3>
                <Elements options={{ clientSecret }} stripe={stripePromise}>
                  <SetupForm
                    amount={totalPerQuarter}
                    clientSecret={clientSecret}
                    onSuccess={handleSetupSuccess}
                  />
                </Elements>
              </CardBody>
            </Card>
          ) : (
            <>
              <Button
                className="btn-brand bg-primary w-full font-semibold"
                isDisabled={product.stock === 0}
                isLoading={loading}
                size="lg"
                onPress={createSubscription}
              >
                {t("step_payment")}
              </Button>
              {orderError && (
                <p className="text-danger text-sm mt-2">{orderError}</p>
              )}
            </>
          )}
        </div>

        {/* Summary sidebar */}
        <div>
          <Card className="border border-divider sticky top-24">
            <CardBody className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">
                {t("subscription_summary")}
              </h3>

              {product.image && (
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    fill
                    alt={product.name}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 300px"
                    src={
                      product.image.startsWith("http")
                        ? product.image
                        : `/${product.image}`
                    }
                  />
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-default-600">{product.name} x1</span>
                <span>
                  {price.toFixed(2)}
                  {common("currency")}
                </span>
              </div>

              <Divider />

              <div className="flex justify-between text-sm">
                <span>{common("subtotal")}</span>
                <span>
                  {price.toFixed(2)}
                  {common("currency")}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>{common("shipping")}</span>
                <span>
                  {shippingCost.toFixed(2)}
                  {common("currency")}
                </span>
              </div>

              {selectedRelay && (
                <div className="text-xs text-default-500">
                  {selectedRelay.name} — {selectedRelay.address.city}
                </div>
              )}

              <Divider />

              <div className="flex justify-between text-xl font-bold">
                <span>{common("total")}</span>
                <span className="text-primary">
                  {totalPerQuarter.toFixed(2)}
                  {common("currency")}
                </span>
              </div>

              <p className="text-xs text-default-400 text-center">
                {t("per_quarter")}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

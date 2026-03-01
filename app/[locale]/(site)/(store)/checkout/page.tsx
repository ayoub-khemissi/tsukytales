"use client";

import type { RelayPoint } from "@/components/store/relay-picker";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Radio, RadioGroup } from "@heroui/radio";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Chip } from "@heroui/chip";
import { isValidPhoneNumber } from "libphonenumber-js";
import dynamic from "next/dynamic";

import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/store/cart-context";
import {
  SavedCardPicker,
  type SavedCard,
} from "@/components/store/saved-card-picker";

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

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

function PaymentForm({
  clientSecret,
  amount,
  orderId,
  savedCards,
}: {
  clientSecret: string;
  amount: number;
  orderId: number | null;
  savedCards: SavedCard[];
}) {
  const t = useTranslations("checkout");
  const at = useTranslations("account");
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCard, setSelectedCard] = useState(
    savedCards.find((c) => c.is_default)?.id || savedCards[0]?.id || "new",
  );
  const useSaved = selectedCard !== "new";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe) return;
    if (!useSaved && !elements) return;
    setLoading(true);
    setError("");

    const returnUrl = new URL(
      `${window.location.origin}/checkout?success=true`,
    );

    if (orderId) returnUrl.searchParams.set("order_id", String(orderId));

    const result = useSaved
      ? await stripe.confirmPayment({
          clientSecret,
          confirmParams: {
            payment_method: selectedCard,
            return_url: returnUrl.toString(),
          },
          redirect: "if_required",
        })
      : await stripe.confirmPayment({
          elements: elements!,
          confirmParams: {
            return_url: returnUrl.toString(),
          },
        });

    if (result.error) {
      setError(result.error.message || t("error_payment"));
      setLoading(false);
    }
  };

  return (
    <Form
      className="space-y-4"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      {savedCards.length > 0 && (
        <SavedCardPicker
          cards={savedCards}
          defaultLabel={at("payments_default")}
          newCardLabel={t("new_card")}
          selected={selectedCard}
          onSelect={setSelectedCard}
        />
      )}
      {!useSaved && (
        <div className="w-full">
          <PaymentElement />
        </div>
      )}
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

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const common = useTranslations("common");
  const { data: session } = useSession();
  const { items, total, clearCart } = useCart();
  const [shippingMethod, setShippingMethod] = useState("relay");
  const [selectedRelay, setSelectedRelay] = useState<RelayPoint | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
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
  const [customerName, setCustomerName] = useState({
    first_name: "",
    last_name: "",
  });
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);

  // Fetch saved addresses + customer profile + payment methods for logged-in users
  useEffect(() => {
    if (session?.user?.role !== "customer") return;
    Promise.all([
      fetch("/api/store/addresses/me").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/store/customer/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/store/customer/payment-methods").then((r) =>
        r.ok ? r.json() : { cards: [] },
      ),
    ])
      .then(
        ([addresses, profile, paymentData]: [
          SavedAddress[],
          Record<string, string> | null,
          { cards: SavedCard[] },
        ]) => {
          const name = {
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
          };

          setCustomerName(name);
          setSavedAddresses(addresses);
          setSavedCards(paymentData.cards || []);
          const defaultAddr =
            addresses.find((a) => a.is_default) || addresses[0];

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
          } else {
            setAddress((prev) => ({ ...prev, ...name }));
          }
        },
      )
      .catch(() => {});
  }, [session?.user]);

  const selectSavedAddress = (addrId: string) => {
    setAddressMode(addrId);
    if (addrId === "new") {
      setAddress({
        first_name: customerName.first_name,
        last_name: customerName.last_name,
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

  // Confirm order after Stripe redirect (belt-and-suspenders, webhook is primary)
  const confirmAfterRedirect = useCallback(
    async (oid: string) => {
      try {
        await fetch(`/api/store/orders/${oid}/confirm`, { method: "POST" });
      } catch {
        // Webhook will handle confirmation if this fails
      }
      setSuccess(true);
      clearCart();
    },
    [clearCart],
  );

  // Check for success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("success") === "true") {
      const oid = params.get("order_id");
      const redirectStatus = params.get("redirect_status");

      if (oid) {
        setOrderId(parseInt(oid));
        if (redirectStatus === "succeeded" || !redirectStatus) {
          confirmAfterRedirect(oid);

          return;
        }
      }
      setSuccess(true);
      clearCart();
    }
  }, [clearCart, confirmAfterRedirect]);

  const [relayPrice, setRelayPrice] = useState(4.9);
  const [homePrice, setHomePrice] = useState(7.5);

  useEffect(() => {
    const weight = items.reduce(
      (sum, i) => sum + (i.weight || 0.3) * i.quantity,
      0,
    );

    fetch(
      `/api/store/shipping/rates?weight=${weight}&country=${address.country}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setRelayPrice(data.relay?.price || 4.9);
        setHomePrice(data.home?.price || 7.5);
      })
      .catch(() => {});
  }, [items, address.country]);

  const handleShippingMethodChange = (value: string) => {
    setShippingMethod(value);
    if (value !== "relay") setSelectedRelay(null);
  };

  const shippingCost = shippingMethod === "relay" ? relayPrice : homePrice;
  const grandTotal = total + shippingCost;

  const createOrder = async () => {
    if (shippingMethod === "relay" && !selectedRelay) {
      setOrderError(t("relay_required"));

      return;
    }
    setLoading(true);
    setOrderError("");
    try {
      const orderEmail = session?.user?.email || email;

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

      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.id,
            variant_id: i.variantId,
            quantity: i.quantity,
          })),
          shipping_address: shippingAddress,
          shipping_method: shippingMethod,
          relay_code: selectedRelay?.code,
          guest_email:
            session?.user?.role !== "customer" ? orderEmail : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Order failed");
      setOrderId(data.order?.id || data.id);
      setClientSecret(data.client_secret);
    } catch {
      setOrderError(t("error_order"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto max-w-lg px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">{t("success_title")}</h1>
        <p className="text-default-600 mb-2">{t("success_message")}</p>
        {orderId && (
          <p className="text-primary font-semibold mb-8">
            {t("success_order_number", { number: `TSK-${orderId}` })}
          </p>
        )}
        <Button
          as={Link}
          className="btn-brand bg-primary w-full sm:w-auto font-semibold"
          href="/subscription"
          size="lg"
        >
          {common("see_all")}
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-default-500 mb-4">{common("no_results")}</p>
        <Button
          as={Link}
          className="btn-brand bg-primary w-full sm:w-auto font-semibold"
          href="/subscription"
          size="lg"
        >
          {common("see_all")}
        </Button>
      </div>
    );
  }

  const updateAddress = (field: string) => (value: string) =>
    setAddress((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Email for guests (hidden if logged in — email comes from session) */}
          {!session?.user && (
            <Card className="border border-divider">
              <CardBody className="p-6">
                <Input
                  isRequired
                  label={t("guest_email")}
                  type="email"
                  value={email}
                  onValueChange={setEmail}
                />
              </CardBody>
            </Card>
          )}

          {/* Shipping method */}
          <Card className="border border-divider">
            <CardBody className="p-6">
              <h3 className="font-semibold mb-4">{t("shipping_method")}</h3>
              <RadioGroup
                value={shippingMethod}
                onValueChange={handleShippingMethodChange}
              >
                <Radio value="relay">
                  {t("shipping_relay")} —{" "}
                  {relayPrice.toFixed(2).replace(".", ",")}
                  {common("currency")}
                </Radio>
                <Radio value="home">
                  {t("shipping_home")} —{" "}
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
                        {t("relay_select")} : {selectedRelay.name}
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
                <h3 className="font-semibold">{t("shipping_address")}</h3>

                {/* Saved addresses picker (logged-in users only) */}
                {session?.user?.role === "customer" &&
                  savedAddresses.length > 0 && (
                    <RadioGroup
                      label={t("saved_addresses")}
                      value={addressMode}
                      onValueChange={selectSavedAddress}
                    >
                      {savedAddresses.map((addr) => (
                        <Radio key={addr.id} value={String(addr.id)}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{addr.label}</span>
                            {!!addr.is_default && (
                              <Chip color="primary" size="sm" variant="flat">
                                {t("default_badge")}
                              </Chip>
                            )}
                          </div>
                          <span className="text-sm text-default-500">
                            {addr.first_name} {addr.last_name} — {addr.street},{" "}
                            {addr.zip_code} {addr.city}
                          </span>
                        </Radio>
                      ))}
                      <Radio value="new">{t("new_address")}</Radio>
                    </RadioGroup>
                  )}

                {/* Address form (always shown for guests, shown when "new" selected for logged-in) */}
                {(session?.user?.role !== "customer" ||
                  savedAddresses.length === 0 ||
                  addressMode === "new") && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        isRequired
                        label={
                          common("quantity") === "Quantité"
                            ? "Prénom"
                            : "First name"
                        }
                        maxLength={100}
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
                        maxLength={100}
                        value={address.last_name}
                        onValueChange={updateAddress("last_name")}
                      />
                    </div>
                    <Input
                      isRequired
                      label={
                        common("quantity") === "Quantité" ? "Adresse" : "Street"
                      }
                      maxLength={255}
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
                        maxLength={10}
                        value={address.zip_code}
                        onValueChange={updateAddress("zip_code")}
                      />
                      <Input
                        isRequired
                        label={
                          common("quantity") === "Quantité" ? "Ville" : "City"
                        }
                        maxLength={100}
                        value={address.city}
                        onValueChange={updateAddress("city")}
                      />
                    </div>
                    <Input
                      isRequired
                      errorMessage={t("error_phone")}
                      label={
                        common("quantity") === "Quantité"
                          ? "Téléphone"
                          : "Phone"
                      }
                      type="tel"
                      validate={(value) =>
                        !isValidPhoneNumber(value, address.country as any)
                          ? t("error_phone")
                          : true
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
                <h3 className="font-semibold mb-4">{t("payment_title")}</h3>
                <Elements options={{ clientSecret }} stripe={stripePromise}>
                  <PaymentForm
                    amount={grandTotal}
                    clientSecret={clientSecret}
                    orderId={orderId}
                    savedCards={savedCards}
                  />
                </Elements>
              </CardBody>
            </Card>
          ) : (
            <>
              <Button
                className="btn-brand bg-primary w-full font-semibold"
                isLoading={loading}
                size="lg"
                onPress={createOrder}
              >
                {t("step_payment")}
              </Button>
              {orderError && (
                <p className="text-danger text-sm mt-2">{orderError}</p>
              )}
            </>
          )}
        </div>

        {/* Summary */}
        <div>
          <Card className="border border-divider sticky top-24">
            <CardBody className="p-6 space-y-3">
              <h3 className="font-semibold text-lg">{t("order_summary")}</h3>
              {items.map((item) => (
                <div
                  key={item.variantId ?? item.id}
                  className="flex justify-between text-sm"
                >
                  <span className="text-default-600">
                    {item.name} x{item.quantity}
                  </span>
                  <span>
                    {(item.price * item.quantity).toFixed(2)}
                    {common("currency")}
                  </span>
                </div>
              ))}
              <Divider />
              <div className="flex justify-between text-sm">
                <span>{common("subtotal")}</span>
                <span>
                  {total.toFixed(2)}
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
                  {grandTotal.toFixed(2)}
                  {common("currency")}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

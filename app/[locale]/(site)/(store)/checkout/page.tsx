"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Radio, RadioGroup } from "@heroui/radio";
import { Divider } from "@heroui/divider";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/store/cart-context";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

function PaymentForm({
  amount,
}: {
  clientSecret: string; // provided by parent, used by Stripe Elements wrapper
  amount: number;
}) {
  const t = useTranslations("checkout");
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?success=true`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || t("error_payment"));
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-danger text-sm">{error}</p>}
      <Button
        className="w-full font-semibold"
        color="primary"
        isDisabled={!stripe}
        isLoading={loading}
        size="lg"
        type="submit"
      >
        {t("pay_button", { amount: amount.toFixed(2) })}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const common = useTranslations("common");
  const { data: session } = useSession();
  const { items, total, clearCart } = useCart();
  const [shippingMethod, setShippingMethod] = useState("relay");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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

  // Check for success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("success") === "true") {
      setSuccess(true);
      clearCart();
    }
  }, [clearCart]);

  const [shippingCost, setShippingCost] = useState(4.9);

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
        setShippingCost(
          shippingMethod === "relay"
            ? data.relay?.price || 4.9
            : data.home?.price || 7.5,
        );
      })
      .catch(() => {});
  }, [items, address.country, shippingMethod]);

  const grandTotal = total + shippingCost;

  const createOrder = async () => {
    setLoading(true);
    try {
      const orderEmail = session?.user?.email || email;
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: orderEmail,
          items: items.map((i) => ({
            product_id: i.id,
            variant_id: i.variantId,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            weight: i.weight,
          })),
          shipping_address: address,
          shipping_method: shippingMethod,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Order failed");
      setOrderId(data.order?.id || data.id);
      setClientSecret(data.client_secret);
    } catch (err) {
      void err;
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
          color="primary"
          href="/shop"
          radius="full"
          variant="shadow"
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
        <Button as={Link} color="primary" href="/shop">
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
          {/* Email for guests */}
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
                onValueChange={setShippingMethod}
              >
                <Radio value="relay">
                  {t("shipping_relay")} —{" "}
                  {shippingCost === 4.9
                    ? "4,90"
                    : shippingCost.toFixed(2).replace(".", ",")}
                  {common("currency")}
                </Radio>
                <Radio value="home">
                  {t("shipping_home")} —{" "}
                  {shippingMethod === "home"
                    ? shippingCost.toFixed(2).replace(".", ",")
                    : "7,50"}
                  {common("currency")}
                </Radio>
              </RadioGroup>
            </CardBody>
          </Card>

          {/* Shipping address */}
          <Card className="border border-divider">
            <CardBody className="p-6 space-y-4">
              <h3 className="font-semibold">{t("shipping_address")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  isRequired
                  label={
                    common("quantity") === "Quantité" ? "Prénom" : "First name"
                  }
                  value={address.first_name}
                  onValueChange={updateAddress("first_name")}
                />
                <Input
                  isRequired
                  label={
                    common("quantity") === "Quantité" ? "Nom" : "Last name"
                  }
                  value={address.last_name}
                  onValueChange={updateAddress("last_name")}
                />
              </div>
              <Input
                isRequired
                label={common("quantity") === "Quantité" ? "Adresse" : "Street"}
                value={address.street}
                onValueChange={updateAddress("street")}
              />
              <div className="grid grid-cols-2 gap-3">
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
                  label={common("quantity") === "Quantité" ? "Ville" : "City"}
                  value={address.city}
                  onValueChange={updateAddress("city")}
                />
              </div>
              <Input
                label={
                  common("quantity") === "Quantité" ? "Téléphone" : "Phone"
                }
                value={address.phone}
                onValueChange={updateAddress("phone")}
              />
            </CardBody>
          </Card>

          {/* Payment */}
          {clientSecret ? (
            <Card className="border border-divider">
              <CardBody className="p-6">
                <h3 className="font-semibold mb-4">{t("payment_title")}</h3>
                <Elements options={{ clientSecret }} stripe={stripePromise}>
                  <PaymentForm
                    amount={grandTotal}
                    clientSecret={clientSecret}
                  />
                </Elements>
              </CardBody>
            </Card>
          ) : (
            <Button
              className="w-full font-semibold"
              color="primary"
              isLoading={loading}
              size="lg"
              onPress={createOrder}
            >
              {t("step_payment")}
            </Button>
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

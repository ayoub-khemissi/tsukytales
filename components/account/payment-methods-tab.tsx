"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

function AddCardForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("account");
  const common = useTranslations("common");
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

    returnUrl.searchParams.set("tab", "payments");

    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: returnUrl.toString() },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || t("payments_error"));
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-danger text-sm">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          className="w-full sm:w-auto btn-brand bg-primary font-semibold"
          isDisabled={!stripe}
          isLoading={loading}
          type="submit"
        >
          {t("payments_add")}
        </Button>
        <Button className="w-full sm:w-auto" variant="light" onPress={onCancel}>
          {common("cancel")}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentMethodsTab() {
  const t = useTranslations("account");
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch("/api/store/customer/payment-methods");

      if (res.ok) {
        const data = await res.json();

        setCards(data.cards);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddCard = async () => {
    try {
      const res = await fetch("/api/store/customer/setup-intent", {
        method: "POST",
      });

      if (!res.ok) {
        showMessage("error", t("payments_error"));

        return;
      }
      const data = await res.json();

      setClientSecret(data.client_secret);
      setShowForm(true);
    } catch {
      showMessage("error", t("payments_error"));
    }
  };

  const handleCardAdded = async () => {
    setShowForm(false);
    setClientSecret(null);
    showMessage("success", t("payments_saved"));
    setLoading(true);
    await fetchCards();
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(
        `/api/store/customer/payment-methods/${id}/default`,
        { method: "POST" },
      );

      if (!res.ok) {
        showMessage("error", t("payments_error"));

        return;
      }
      await fetchCards();
    } catch {
      showMessage("error", t("payments_error"));
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm(t("payments_confirm"))) return;
    try {
      const res = await fetch(`/api/store/customer/payment-methods/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        showMessage("error", t("payments_error"));

        return;
      }
      await fetchCards();
    } catch {
      showMessage("error", t("payments_error"));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`${message.type === "success" ? "bg-success-50 text-success" : "bg-danger-50 text-danger"} p-3 rounded-2xl text-sm font-medium`}
        >
          {message.text}
        </div>
      )}

      {cards.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[30px] shadow-lg border border-[rgba(88,22,104,0.05)] text-center px-5 py-12 sm:px-8 sm:py-16">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl mx-auto mb-4">
            <FontAwesomeIcon icon={faCreditCard} />
          </div>
          <p className="text-text-light dark:text-gray-400 mb-4">
            {t("payments_empty")}
          </p>
          <Button
            className="btn-brand bg-primary font-semibold"
            size="lg"
            onPress={handleAddCard}
          >
            {t("payments_add")}
          </Button>
        </div>
      ) : (
        <>
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-gray-900 rounded-[20px] sm:rounded-[24px] shadow-md border border-[rgba(88,22,104,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg px-4 py-5 sm:px-8 sm:py-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm shrink-0">
                    <FontAwesomeIcon icon={faCreditCard} />
                  </div>
                  <div>
                    <span className="font-semibold text-text-brand dark:text-white capitalize">
                      {card.brand}
                    </span>
                    <span className="text-text-light dark:text-gray-400 ml-2">
                      ****{card.last4}
                    </span>
                    <span className="text-text-light dark:text-gray-400 ml-2 text-sm">
                      {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                    </span>
                  </div>
                  {card.is_default && (
                    <Chip color="primary" size="sm" variant="flat">
                      {t("payments_default")}
                    </Chip>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {!card.is_default && (
                    <>
                      <Button
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={() => handleSetDefault(card.id)}
                      >
                        {t("payments_set_default")}
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() => handleRemove(card.id)}
                      >
                        {t("payments_remove")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {showForm && clientSecret ? (
            <div className="bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[30px] shadow-lg border border-[rgba(88,22,104,0.05)] px-5 py-6 sm:px-10 sm:py-10">
              <h3 className="font-heading italic text-lg font-bold text-text-brand dark:text-white mb-4">
                {t("payments_add")}
              </h3>
              <Elements options={{ clientSecret }} stripe={stripePromise}>
                <AddCardForm
                  onCancel={() => {
                    setShowForm(false);
                    setClientSecret(null);
                  }}
                  onSuccess={handleCardAdded}
                />
              </Elements>
            </div>
          ) : (
            !showForm && (
              <Button
                className="btn-brand bg-primary font-semibold"
                onPress={handleAddCard}
              >
                {t("payments_add")}
              </Button>
            )
          )}
        </>
      )}
    </div>
  );
}

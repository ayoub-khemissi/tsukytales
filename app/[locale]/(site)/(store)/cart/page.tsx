"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/store/cart-context";
import { TrashIcon } from "@/components/icons";

export default function CartPage() {
  const t = useTranslations("cart");
  const common = useTranslations("common");
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");

  const applyPromo = async () => {
    setPromoError("");
    try {
      const res = await fetch("/api/store/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, total }),
      });
      const data = await res.json();
      if (res.ok && data.discount) {
        setDiscount(data.discount);
      } else {
        setPromoError(t("discount_error"));
      }
    } catch {
      setPromoError(t("discount_error"));
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-lg px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-default-100 flex items-center justify-center">
          <span className="text-4xl">{"\uD83D\uDED2"}</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
        <p className="text-default-500 mb-6">{t("empty")}</p>
        <Button as={Link} href="/shop" color="primary" variant="shadow" radius="full">
          {t("empty_cta")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.variantId ?? item.id} className="border border-divider">
              <CardBody className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-28 bg-default-100 rounded-lg overflow-hidden relative flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={`/${item.image}`}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">{"\uD83D\uDCDA"}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/product/${item.slug}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                        {item.name}
                      </Link>
                      <p className="text-primary font-bold mt-1">
                        {item.price}{common("currency")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          onPress={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          onPress={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                        >
                          +
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">
                          {(item.price * item.quantity).toFixed(2)}{common("currency")}
                        </span>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => removeItem(item.id, item.variantId)}
                        >
                          <TrashIcon size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          <div className="flex justify-between items-center pt-2">
            <Button as={Link} href="/shop" variant="light" size="sm">
              &larr; {t("continue_shopping")}
            </Button>
            <Button variant="flat" color="danger" size="sm" onPress={clearCart}>
              {t("clear")}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div>
          <Card className="border border-divider sticky top-24">
            <CardBody className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">{t("subtotal")}</h3>
              <div className="flex justify-between text-sm">
                <span className="text-default-600">{t("subtotal")}</span>
                <span>{total.toFixed(2)}{common("currency")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>{t("discount_applied", { amount: discount.toFixed(2) })}</span>
                </div>
              )}
              <p className="text-xs text-default-400">{t("shipping_info")}</p>
              <Divider />
              <div className="flex justify-between text-xl font-bold">
                <span>{common("total")}</span>
                <span className="text-primary">{(total - discount).toFixed(2)}{common("currency")}</span>
              </div>

              {/* Promo code */}
              <div className="flex gap-2">
                <Input
                  size="sm"
                  placeholder={t("promo_code")}
                  value={promoCode}
                  onValueChange={setPromoCode}
                />
                <Button size="sm" variant="flat" color="primary" onPress={applyPromo}>
                  {t("apply")}
                </Button>
              </div>
              {promoError && <p className="text-danger text-xs">{promoError}</p>}

              <Button
                as={Link}
                href="/checkout"
                color="primary"
                size="lg"
                className="w-full font-semibold"
                variant="shadow"
              >
                {t("checkout")}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

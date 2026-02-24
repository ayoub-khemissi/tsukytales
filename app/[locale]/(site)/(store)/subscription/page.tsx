"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faSyncAlt } from "@fortawesome/free-solid-svg-icons";

import { Link } from "@/i18n/navigation";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";

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
  subscription_dates: string[] | null;
}

export default function SubscriptionPage() {
  const t = useTranslations("subscription");
  const common = useTranslations("common");
  const { data: session } = useSession();
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  useScrollReveal();

  useEffect(() => {
    fetch("/api/store/products?subscription=true")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-bg-brand dark:from-bg-dark to-transparent pointer-events-none z-[5]" />
        <div className="relative z-10 max-w-[850px] mx-auto px-6 py-20 text-center">
          <div className="glass rounded-[50px]" style={{ padding: "4rem" }}>
            <span className="magic-text block uppercase tracking-[6px] text-[0.8rem] font-semibold mb-8">
              {t("hero_overline")}
            </span>
            <h1
              className="font-heading font-bold text-primary dark:text-white leading-none mb-8"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", letterSpacing: "-1px" }}
            >
              {t("hero_title")}
            </h1>
            <p className="text-[1.2rem] font-normal leading-relaxed max-w-[600px] mx-auto text-primary dark:text-gray-300">
              {t("hero_subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* ========== PLANS ========== */}
      <section className="section-reveal py-16 md:py-32">
        <div className="container mx-auto max-w-[1200px] px-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" color="primary" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-default-500 text-lg">
              {common("no_results")}
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-12">
              {products.map((product, index) => (
                <PlanCard
                  key={product.id}
                  product={product}
                  index={index}
                  session={session}
                  t={t}
                  common={common}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </section>

    </>
  );
}

/* ========== Plan Card Component ========== */

function PlanCard({
  product,
  index,
  session,
  t,
  common,
  formatDate,
}: {
  product: SubscriptionProduct;
  index: number;
  session: ReturnType<typeof useSession>["data"];
  t: ReturnType<typeof useTranslations>;
  common: ReturnType<typeof useTranslations>;
  formatDate: (d: string) => string;
}) {
  const price = product.subscription_price ?? product.price;
  const dates = product.subscription_dates ?? [];
  const isLowStock = product.stock > 0 && product.stock < 10;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      className="step-card-reveal w-full max-w-[400px]"
      style={{ transitionDelay: `${index * 0.15}s` }}
    >
      <div className="step-card relative bg-white dark:bg-gray-900 rounded-[40px] shadow-lg border border-white/50 dark:border-white/10 overflow-hidden flex flex-col h-[750px]"
        style={{ padding: "5rem 3rem 4rem" }}
      >
        {/* Subscription badge */}
        {product.is_subscription && (
          <span className="absolute top-5 left-5 z-10 bg-gradient-to-r from-primary to-primary-light text-white text-[0.7rem] font-semibold px-3 py-1 rounded-full">
            {t("badge_subscription")}
          </span>
        )}

        {/* Stock badge */}
        {isLowStock && (
          <span className="absolute top-5 right-5 z-10 bg-warning text-white text-[0.7rem] font-semibold px-3 py-1 rounded-full">
            {t("stock_low", { count: product.stock })}
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-5 right-5 z-10 bg-danger text-white text-[0.7rem] font-semibold px-3 py-1 rounded-full">
            {t("stock_out")}
          </span>
        )}

        {/* Step number */}
        <span className="absolute top-5 left-1/2 -translate-x-1/2 z-10 w-[35px] h-[35px] rounded-full bg-gradient-to-br from-accent-gold to-accent-gold-light flex items-center justify-center text-white font-bold text-sm shadow-md">
          {index + 1}
        </span>

        {/* Logo / Image */}
        <div className="mx-auto mb-6 w-[100px] h-[100px] rounded-full bg-[#f8eef6] dark:bg-primary/20 border-3 border-primary shadow-md flex items-center justify-center overflow-hidden">
          <Image
            src="/assets/img/hero_logo.png"
            alt={product.name}
            width={100}
            height={100}
            className="object-cover scale-[1.8]"
            style={{ objectPosition: "center 18%" }}
          />
        </div>

        {/* Product name */}
        <h3 className="font-heading text-center text-[1.5rem] font-bold text-text-brand dark:text-white tracking-[2px] min-h-[3.6rem] flex items-center justify-center uppercase">
          {product.name}
        </h3>

        {/* Description bubble */}
        <div className="mt-4 p-6 bg-bg-brand dark:bg-gray-800 rounded-[30px] min-h-[180px] flex items-center justify-center border border-primary/5 w-full">
          <p className="text-[0.85rem] font-medium text-primary dark:text-gray-300 text-center leading-relaxed uppercase tracking-[1px]">
            {product.description ||
              (product.is_subscription
                ? "ABONNEMENT — RECEVEZ VOTRE BOX EXCLUSIVE."
                : "UNE BOX EXCLUSIVE LIVRÉE CHEZ VOUS AVEC SOIN.")}
          </p>
        </div>

        {/* Footer — pushed to bottom */}
        <div className="mt-auto pt-6 text-center">
          {/* Price */}
          <div className="mb-4">
            <span className="font-heading text-[2rem] font-bold text-primary">
              {price.toFixed(2).replace(".", ",")}{common("currency")}
            </span>
            {product.is_subscription && (
              <span className="text-text-light dark:text-gray-400 text-sm ml-1">
                {t("per_quarter")}
              </span>
            )}
          </div>

          {/* Subscription dates */}
          {product.is_subscription && dates.length > 0 && (
            <p className="text-[0.85rem] text-text-light dark:text-gray-400 mb-4">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
              {t("billing_dates")} : {dates.map(formatDate).join(" · ")}
            </p>
          )}

          {/* CTA */}
          {product.is_subscription ? (
            <Button
              as={Link}
              href={session?.user ? `/product/${product.slug}` : "/login"}
              size="lg"
              radius="full"
              isDisabled={isOutOfStock}
              className="btn-brand bg-primary font-semibold w-full"
            >
              <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />
              {t("subscribe_cta")}
            </Button>
          ) : (
            <Button
              as={Link}
              href={`/product/${product.slug}`}
              size="lg"
              radius="full"
              isDisabled={isOutOfStock}
              className="btn-brand bg-primary font-semibold w-full"
            >
              {t("add_to_cart")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

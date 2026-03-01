"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSyncAlt,
  faShoppingCart,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";

import { Link, useRouter } from "@/i18n/navigation";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";
import { useCart } from "@/lib/store/cart-context";

interface ActiveProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: string | null;
  images: string[] | null;
  description: string | null;
  is_preorder: boolean;
  subscription_price: number | null;
}

export default function SubscriptionPage() {
  const t = useTranslations("subscription");
  const common = useTranslations("common");
  const locale = useLocale();
  const { data: session } = useSession();
  const [product, setProduct] = useState<ActiveProduct | null>(null);
  const [subscriptionDates, setSubscriptionDates] = useState<string[]>([]);
  const [showProductDetail, setShowProductDetail] = useState(true);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const router = useRouter();

  useScrollReveal(undefined, [loading]);

  useEffect(() => {
    fetch(`/api/store/products?subscription_page=true&locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        const items = data.items || [];

        setProduct(items[0] ?? null);
        setSubscriptionDates(data.subscription_dates || []);
        setShowProductDetail(data.show_product_detail ?? true);
      })
      .finally(() => setLoading(false));
  }, [locale]);

  // Check if already subscribed
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/store/subscriptions/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.active) setAlreadySubscribed(true);
      })
      .catch(() => {});
  }, [session?.user]);

  const isPreorder = !!product?.is_preorder;

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 max-w-[850px] mx-auto px-6 py-20 text-center">
          <div className="glass rounded-[24px] sm:rounded-[50px] px-5 py-8 sm:px-10 sm:py-12 md:px-16 md:py-16">
            <span className="magic-text block uppercase tracking-[3px] sm:tracking-[6px] text-[0.75rem] sm:text-[0.8rem] font-semibold mb-6 sm:mb-8">
              {t("hero_overline")}
            </span>
            <h1
              className="font-heading font-bold text-primary dark:text-white leading-none mb-8"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                letterSpacing: "-1px",
              }}
            >
              {t("hero_title")}{" "}
              <span className="inline-block whitespace-nowrap">
                {t.has("hero_title_prefix") && t("hero_title_prefix")}
                <span className="magic-text">{t("hero_title_accent")}</span>
              </span>
              {t.has("hero_title_suffix") && <> {t("hero_title_suffix")}</>}
            </h1>
            <p className="text-base sm:text-[1.2rem] font-normal leading-relaxed max-w-[600px] mx-auto text-primary dark:text-gray-300">
              {t("hero_subtitle")}
            </p>
          </div>

          <button
            aria-label="Scroll to next section"
            className="mt-10 cursor-pointer bg-transparent border-none"
            style={{ animation: "bounce 2s infinite" }}
            onClick={() =>
              document
                .getElementById("plans")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <ChevronDownIcon
              className="mx-auto text-text-brand/50 dark:text-white/50"
              size={24}
            />
          </button>
        </div>
      </section>

      {/* ========== CONTENT ========== */}
      <section
        className="section-reveal min-h-screen flex flex-col items-center justify-center py-16"
        id="plans"
      >
        <div className="container mx-auto max-w-[1200px]">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner color="primary" size="lg" />
            </div>
          ) : !product ? (
            <p className="text-center text-default-500 text-lg">
              {common("no_results")}
            </p>
          ) : (
            <div className="space-y-12">
              {/* Top row: 2 cards */}
              <div className="flex flex-col md:flex-row justify-evenly gap-8">
                {/* Mobile: preorder first */}
                <div className="order-2 md:order-1 w-full max-w-[360px] mx-auto md:mx-0">
                  <SubscriptionCard
                    alreadySubscribed={alreadySubscribed}
                    common={common}
                    locale={locale}
                    product={product}
                    session={session}
                    subscriptionDates={subscriptionDates}
                    t={t}
                  />
                </div>
                <div className="order-1 md:order-2 w-full max-w-[360px] mx-auto md:mx-0">
                  <PreorderCard
                    addItem={addItem}
                    common={common}
                    product={product}
                    router={router}
                    t={t}
                  />
                </div>
              </div>

              {/* Detail section — only when preorder is active */}
              {isPreorder && showProductDetail && (
                <DetailSection common={common} product={product} t={t} />
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* ========== Subscription Card ========== */

function SubscriptionCard({
  product,
  session,
  t,
  common,
  subscriptionDates,
  locale,
  alreadySubscribed,
}: {
  product: ActiveProduct;
  session: ReturnType<typeof useSession>["data"];
  t: ReturnType<typeof useTranslations>;
  common: ReturnType<typeof useTranslations>;
  subscriptionDates: string[];
  locale: string;
  alreadySubscribed: boolean;
}) {
  const price = product.subscription_price ?? product.price;
  const isOutOfStock = product.stock === 0;

  const today = new Date().toISOString().split("T")[0];
  const upcomingDates = subscriptionDates.filter((d) => d > today).slice(0, 3);

  return (
    <div className="step-card relative bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[40px] shadow-lg border border-white/50 dark:border-white/10 overflow-hidden flex flex-col h-full min-h-[550px] sm:min-h-[620px] px-5 pt-14 pb-8 sm:px-10 sm:pt-18 sm:pb-12">
      {/* Badge */}
      <span className="absolute top-5 left-5 z-10 bg-gradient-to-r from-primary to-primary-light text-white text-[0.7rem] font-semibold px-3 py-1 rounded-full">
        {t("badge_subscription")}
      </span>

      {/* Logo + Title */}
      <div className="mt-6 mb-8 text-center flex flex-col items-center gap-4">
        <Image
          alt="Tsuky Tales"
          className="rounded-full"
          height={80}
          src="/assets/img/logo-round.svg"
          width={80}
        />
        <h3 className="font-heading text-[1.3rem] sm:text-[1.5rem] font-bold text-text-brand dark:text-white tracking-[2px] uppercase">
          {t("card_sub_title")}
        </h3>
      </div>

      {/* Description bubble */}
      <div className="p-4 sm:p-6 bg-bg-brand dark:bg-gray-800 rounded-[20px] sm:rounded-[30px] flex items-center justify-center border border-primary/5 w-full flex-1">
        <p className="text-[0.85rem] font-medium text-primary dark:text-gray-300 text-center leading-relaxed uppercase tracking-[1px]">
          {t("card_sub_desc")}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 text-center">
        <div className="mb-4">
          <span className="font-heading text-[2rem] font-bold text-primary">
            {price.toFixed(2).replace(".", ",")}
            {common("currency")}
          </span>
          <span className="text-text-light dark:text-gray-400 text-sm ml-1">
            {t("per_quarter")}
          </span>
        </div>

        {upcomingDates.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-light dark:text-gray-400 mb-2">
              <FontAwesomeIcon className="mr-1" icon={faCalendarAlt} />
              {t("billing_dates")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {upcomingDates.map((d) => (
                <span
                  key={d}
                  className="text-xs bg-bg-brand dark:bg-gray-800 text-primary dark:text-gray-300 px-3 py-1 rounded-full"
                >
                  {new Date(d + "T00:00:00").toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ))}
            </div>
          </div>
        )}

        {alreadySubscribed ? (
          <Button
            as={Link}
            className="btn-brand bg-primary font-semibold w-full"
            href="/account?tab=subscription"
            size="lg"
          >
            <FontAwesomeIcon className="mr-2" icon={faSyncAlt} />
            {t("manage")}
          </Button>
        ) : (
          <Button
            as={Link}
            className="btn-brand bg-primary font-semibold w-full"
            href={session?.user ? `/subscribe` : "/login"}
            isDisabled={isOutOfStock}
            size="lg"
          >
            <FontAwesomeIcon className="mr-2" icon={faSyncAlt} />
            {t("subscribe_cta")}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ========== Preorder Card ========== */

function PreorderCard({
  product,
  t,
  common,
  addItem,
  router,
}: {
  product: ActiveProduct;
  t: ReturnType<typeof useTranslations>;
  common: ReturnType<typeof useTranslations>;
  addItem: (item: {
    id: number;
    name: string;
    price: number;
    image?: string;
    slug: string;
  }) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const isActive = !!product.is_preorder;
  const isOutOfStock = isActive && product.stock === 0;

  return (
    <div className="step-card relative bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[40px] shadow-lg border border-white/50 dark:border-white/10 overflow-hidden flex flex-col h-full min-h-[550px] sm:min-h-[620px] px-5 pt-14 pb-8 sm:px-10 sm:pt-18 sm:pb-12">
      {/* Badge */}
      <span className="absolute top-5 left-5 z-10 bg-gradient-to-r from-accent-gold to-accent-gold-light text-white text-[0.7rem] font-semibold px-3 py-1 rounded-full">
        {common("preorder")}
      </span>

      {/* Stock badge — only when out of stock */}
      {isOutOfStock && (
        <span className="absolute top-5 right-5 z-10 bg-danger text-white text-[0.7rem] font-semibold px-3 py-1 rounded-full">
          {t("stock_out")}
        </span>
      )}

      {/* Logo + Title */}
      <div className="mt-6 mb-8 text-center flex flex-col items-center gap-4">
        <Image
          alt="Tsuky Tales"
          className="rounded-full"
          height={80}
          src="/assets/img/logo-round.svg"
          width={80}
        />
        <h3 className="font-heading text-[1.3rem] sm:text-[1.5rem] font-bold text-text-brand dark:text-white tracking-[2px] uppercase">
          {t("preorder_title")}
        </h3>
      </div>

      {/* Description bubble */}
      <div className="p-4 sm:p-6 bg-bg-brand dark:bg-gray-800 rounded-[20px] sm:rounded-[30px] flex items-center justify-center border border-primary/5 w-full flex-1">
        <p className="text-[0.85rem] font-medium text-primary dark:text-gray-300 text-center leading-relaxed uppercase tracking-[1px]">
          {t("preorder_desc")}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 text-center">
        {/* Price */}
        <div className="mb-4">
          <span className="font-heading text-[2rem] font-bold text-primary">
            {product.price.toFixed(2).replace(".", ",")}
            {common("currency")}
          </span>
        </div>

        {isActive ? (
          <Button
            className="btn-brand bg-gradient-to-r from-accent-gold to-accent-gold-light font-semibold w-full text-white"
            isDisabled={isOutOfStock}
            size="lg"
            onPress={() => {
              addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || undefined,
                slug: product.slug,
              });
              router.push("/checkout");
            }}
          >
            <FontAwesomeIcon className="mr-2" icon={faShoppingCart} />
            {isOutOfStock ? common("out_of_stock") : t("add_to_cart")}
          </Button>
        ) : (
          <Button
            isDisabled
            className="btn-brand bg-default-200 dark:bg-gray-700 font-semibold w-full text-default-500 dark:text-gray-400"
            size="lg"
          >
            {t("coming_soon")}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ========== Detail Section with Gallery ========== */

function DetailSection({
  product,
  t,
  common,
}: {
  product: ActiveProduct;
  t: ReturnType<typeof useTranslations>;
  common: ReturnType<typeof useTranslations>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gallery = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  const price = product.subscription_price ?? product.price;

  return (
    <div className="step-card bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[40px] shadow-lg border border-white/50 dark:border-white/10 overflow-hidden h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 h-full">
        {/* Gallery — 1/3 */}
        {gallery.length > 0 && (
          <div className="relative group h-full md:col-span-1">
            <div
              ref={scrollRef}
              className="flex overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory h-full"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {gallery.map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-full relative snap-start aspect-square md:aspect-auto md:h-full"
                >
                  <Image
                    fill
                    alt={`${product.name} ${i + 1}`}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    src={img.startsWith("http") ? img : `/${img}`}
                  />
                </div>
              ))}
            </div>

            {gallery.length > 1 && (
              <>
                <button
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-[28px] h-[28px] rounded-full bg-black/20 backdrop-blur-sm text-white/80 flex items-center justify-center hover:bg-black/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => scroll("left")}
                >
                  <ChevronLeftIcon size={14} />
                </button>
                <button
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-[28px] h-[28px] rounded-full bg-black/20 backdrop-blur-sm text-white/80 flex items-center justify-center hover:bg-black/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => scroll("right")}
                >
                  <ChevronRightIcon size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Text content — 2/3 */}
        <div className="md:col-span-2 p-6 sm:p-10 flex flex-col justify-center overflow-hidden">
          <p className="text-sm font-medium uppercase tracking-widest mb-2 flex-shrink-0">
            <span className="magic-text">{t("detail_title")}</span>
          </p>
          <h3 className="font-heading text-[1.5rem] sm:text-[2rem] font-bold text-text-brand dark:text-white mb-4 flex-shrink-0">
            {product.name}
          </h3>
          <div className="mb-6 flex-shrink-0">
            <span className="font-heading text-[1.5rem] font-bold text-primary">
              {price.toFixed(2).replace(".", ",")}
              {common("currency")}
            </span>
            {!!product.subscription_price && (
              <span className="text-text-light dark:text-gray-400 text-sm ml-1">
                {t("per_quarter")}
              </span>
            )}
          </div>
          {product.description && (
            <div
              className="overflow-y-auto min-h-0 flex-1"
              style={{ scrollbarWidth: "thin" }}
            >
              <p className="text-text-light dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

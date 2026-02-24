"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/store/cart-context";
import { CartIcon } from "@/components/icons";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  description: string | null;
  stock: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  is_preorder: boolean;
  subscription_price?: number;
}

export default function ProductPage() {
  const t = useTranslations("product");
  const common = useTranslations("common");
  const params = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/store/products?slug=${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data.items?.[0] || data || null);
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("not_found")}</h1>
        <Button as={Link} href="/shop" variant="bordered" color="primary">
          {t("back_to_shop")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-12">
      <Button as={Link} href="/shop" variant="light" size="sm" className="mb-6">
        &larr; {t("back_to_shop")}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product image */}
        <div className="aspect-[3/4] bg-default-100 rounded-2xl overflow-hidden relative">
          {product.image ? (
            <Image
              src={`/${product.image}`}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">{"\uD83D\uDCDA"}</span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col">
          <div className="flex items-start gap-2 mb-2">
            {product.is_preorder && (
              <Chip color="warning" size="sm">{common("preorder")}</Chip>
            )}
            {product.stock > 0 ? (
              <Chip color="success" variant="flat" size="sm">{common("in_stock")}</Chip>
            ) : (
              <Chip color="danger" variant="flat" size="sm">{common("out_of_stock")}</Chip>
            )}
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
          <p className="text-3xl font-bold text-primary mb-6">
            {product.price}{common("currency")}
          </p>

          <Button
            color={added ? "success" : "primary"}
            size="lg"
            className="mb-8 font-semibold"
            isDisabled={product.stock <= 0}
            onPress={() => {
              addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || undefined,
                slug: product.slug,
                weight: product.weight,
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
            startContent={<CartIcon size={20} />}
          >
            {t(added ? "added" : "add_to_cart")}
          </Button>

          <Divider className="mb-6" />

          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">{t("description")}</h3>
              <p className="text-default-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-lg mb-2">{t("details")}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-default-500">{t("weight")}</div>
              <div>{product.weight} kg</div>
              <div className="text-default-500">{t("dimensions")}</div>
              <div>{product.length} x {product.width} x {product.height} cm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

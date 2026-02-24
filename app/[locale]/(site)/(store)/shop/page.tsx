"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/store/cart-context";
import { SearchIcon, CartIcon } from "@/components/icons";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  stock: number;
  is_preorder: boolean;
}

export default function ShopPage() {
  const t = useTranslations("shop");
  const common = useTranslations("common");
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("size", "12");
    if (search) params.set("search", search);

    fetch(`/api/store/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.items || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="container mx-auto max-w-7xl px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-default-500">{t("subtitle")}</p>
      </div>

      <div className="flex justify-center mb-8">
        <Input
          isClearable
          className="max-w-md"
          placeholder={t("search_placeholder")}
          startContent={<SearchIcon className="text-default-400" />}
          value={search}
          onClear={() => setSearch("")}
          onValueChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-default-500 py-20">{t("empty")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="border border-divider group">
                <CardBody className="p-0">
                  <Link href={`/product/${product.slug}`}>
                    <div className="aspect-[3/4] bg-default-100 rounded-t-lg overflow-hidden relative">
                      {product.image ? (
                        <Image
                          fill
                          alt={product.name}
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          src={`/${product.image}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl text-default-300">
                            {"\uD83D\uDCDA"}
                          </span>
                        </div>
                      )}
                      {product.is_preorder && (
                        <Chip
                          className="absolute top-2 left-2"
                          color="warning"
                          size="sm"
                        >
                          {common("preorder")}
                        </Chip>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-primary">
                        {product.price}
                        {common("currency")}
                      </span>
                      <Button
                        color={addedId === product.id ? "success" : "primary"}
                        isDisabled={product.stock <= 0}
                        size="sm"
                        startContent={<CartIcon size={16} />}
                        variant="flat"
                        onPress={() => {
                          addItem({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image || undefined,
                            slug: product.slug,
                          });
                          setAddedId(product.id);
                          setTimeout(() => setAddedId(null), 1500);
                        }}
                      >
                        {addedId === product.id
                          ? t("add_success")
                          : product.stock <= 0
                            ? common("out_of_stock")
                            : common("add_to_cart")}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <Pagination
                showControls
                color="primary"
                page={page}
                total={totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

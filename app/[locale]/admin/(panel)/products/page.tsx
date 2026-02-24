"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { SearchIcon, TrashIcon } from "@/components/icons";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  status: string;
  image: string | null;
}

export default function ProductsPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const limit = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();

      setProducts(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / (data.limit || limit)));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (productId: number) => {
    if (!window.confirm(t("products_delete_confirm"))) return;
    setDeletingId(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchProducts();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("products_title")}</h1>
        <Button
          as={Link}
          color="primary"
          href="/admin/products/new"
          size="sm"
          variant="shadow"
        >
          {t("products_add")}
        </Button>
      </div>

      {/* Search */}
      <Input
        isClearable
        className="max-w-md"
        placeholder={t("products_search")}
        startContent={<SearchIcon className="text-default-400" />}
        value={search}
        onClear={() => setSearch("")}
        onValueChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-default-500 py-20">
          {t("products_empty")}
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider text-left text-default-500">
                  <th className="pb-3 pr-4 font-medium">
                    {t("products_col_name")}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {t("products_col_price")}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {t("products_col_stock")}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {t("products_col_status")}
                  </th>
                  <th className="pb-3 font-medium">
                    {t("products_col_actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-divider/50 hover:bg-default-50 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        className="text-primary font-medium hover:underline"
                        href={`/admin/products/${product.id}`}
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {Number(product.price).toFixed(2)}
                      {common("currency")}
                    </td>
                    <td className="py-3 pr-4">
                      <Chip
                        color={product.stock > 0 ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                      >
                        {product.stock}
                      </Chip>
                    </td>
                    <td className="py-3 pr-4">
                      <Chip
                        color={
                          product.status === "active" ? "success" : "default"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {t(
                          product.status === "active"
                            ? "products_status_active"
                            : "products_status_draft",
                        )}
                      </Chip>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          as={Link}
                          color="primary"
                          href={`/admin/products/${product.id}`}
                          size="sm"
                          variant="light"
                        >
                          {t("products_edit")}
                        </Button>
                        <Button
                          color="danger"
                          isLoading={deletingId === product.id}
                          size="sm"
                          startContent={
                            deletingId !== product.id ? (
                              <TrashIcon size={14} />
                            ) : undefined
                          }
                          variant="light"
                          onPress={() => handleDelete(product.id)}
                        >
                          {common("delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map((product) => (
              <Card key={product.id} className="border border-divider">
                <CardBody className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href={`/admin/products/${product.id}`}
                    >
                      {product.name}
                    </Link>
                    <Chip
                      color={
                        product.status === "active" ? "success" : "default"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {t(
                        product.status === "active"
                          ? "products_status_active"
                          : "products_status_draft",
                      )}
                    </Chip>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold">
                      {Number(product.price).toFixed(2)}
                      {common("currency")}
                    </span>
                    <span className="text-default-500">
                      {t("products_col_stock")}: {product.stock}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      as={Link}
                      className="flex-1"
                      color="primary"
                      href={`/admin/products/${product.id}`}
                      size="sm"
                      variant="flat"
                    >
                      {t("products_edit")}
                    </Button>
                    <Button
                      color="danger"
                      isLoading={deletingId === product.id}
                      size="sm"
                      variant="flat"
                      onPress={() => handleDelete(product.id)}
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
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

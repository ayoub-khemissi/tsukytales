"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { TrashIcon } from "@/components/icons";
import { AdminTableFilters } from "@/components/admin/AdminTableFilters";
import {
  SortableColumn,
  type SortDirection,
} from "@/components/admin/SortableColumn";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  weight: number;
  is_active: boolean;
  is_preorder: boolean;
  image: string | null;
}

export default function ProductsPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const limit = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (sortBy && sortDirection) {
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortDirection);
      }

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();

      setProducts(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / (data.limit || limit)));
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, sortBy, sortDirection]);

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

  const handleSort = (column: string, direction: SortDirection) => {
    setSortBy(direction ? column : null);
    setSortDirection(direction);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
          {t("products_title")}
        </h1>
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

      {/* Filters */}
      <AdminTableFilters
        filters={[
          {
            key: "type",
            label: t("products_filter_type"),
            options: [
              { key: "all", label: t("filter_all") },
              { key: "standard", label: t("products_type_standard") },
              { key: "preorder", label: t("products_type_preorder") },
              { key: "subscription", label: t("products_type_subscription") },
            ],
            value: typeFilter,
            onChange: (v) => {
              setTypeFilter(v);
              setPage(1);
            },
          },
        ]}
        search={{
          value: search,
          placeholder: t("products_search"),
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
        }}
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : products.length === 0 ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("products_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label={t("products_title")}>
              <TableHeader>
                <TableColumn>
                  <SortableColumn
                    column="name"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("products_col_name")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="price"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("products_col_price")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("products_field_weight")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="stock"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("products_col_stock")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("products_col_status")}</TableColumn>
                <TableColumn>{t("products_is_preorder")}</TableColumn>
                <TableColumn>{t("products_col_actions")}</TableColumn>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        className="text-primary font-medium hover:underline"
                        href={`/admin/products/${product.id}`}
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(product.price).toFixed(2)}
                      {common("currency")}
                    </TableCell>
                    <TableCell className="text-default-500">
                      {Number(product.weight).toFixed(2)} kg
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={product.stock > 0 ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                      >
                        {product.stock}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={product.is_active ? "success" : "default"}
                        size="sm"
                        variant="dot"
                      >
                        {t(
                          product.is_active
                            ? "products_status_active"
                            : "products_status_draft",
                        )}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={product.is_preorder ? "warning" : "default"}
                        size="sm"
                        variant="dot"
                      >
                        {product.is_preorder
                          ? t("products_status_active")
                          : t("products_status_draft")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          as={Link}
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
                          startContent={
                            deletingId !== product.id ? (
                              <TrashIcon size={14} />
                            ) : undefined
                          }
                          variant="flat"
                          onPress={() => handleDelete(product.id)}
                        >
                          {common("delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

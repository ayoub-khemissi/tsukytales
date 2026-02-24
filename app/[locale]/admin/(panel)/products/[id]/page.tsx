"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { TrashIcon } from "@/components/icons";

interface Variant {
  id?: number;
  name: string;
  price: number;
  stock: number;
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: number;
  weight: number;
  status: string;
  variants: Variant[];
}

const EMPTY_VARIANT: Variant = { name: "", price: 0, stock: 0 };

const INITIAL_FORM: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  weight: 0,
  status: "draft",
  variants: [],
};

export default function ProductEditPage() {
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}`);

      if (res.ok) {
        const data = await res.json();

        setForm({
          name: data.name || "",
          slug: data.slug || "",
          description: data.description || "",
          price: data.price || 0,
          weight: data.weight || 0,
          status: data.status || "draft",
          variants: data.variants || [],
        });
        setImages(data.images || []);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isNew) fetchProduct();
  }, [isNew, fetchProduct]);

  const updateField = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string | number,
  ) => {
    setForm((prev) => {
      const variants = [...prev.variants];

      variants[index] = { ...variants[index], [field]: value };

      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...EMPTY_VARIANT }],
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();

      formData.append("image", file);
      const res = await fetch("/api/admin/products/upload-image", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();

        setImages((prev) => [...prev, data.url || data.path]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = isNew ? "/api/admin/products" : `/api/admin/products/${id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, images }),
      });

      if (res.ok) {
        const data = await res.json();

        if (isNew && data.id) {
          router.push(`/admin/products/${data.id}`);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Button as={Link} href="/admin/products" size="sm" variant="light">
        &larr; {t("products_back")}
      </Button>

      {/* Header */}
      <h1 className="text-2xl font-bold">
        {isNew ? t("products_create_title") : t("products_edit_title")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-divider">
            <CardHeader>
              <h2 className="font-semibold text-lg">{t("products_general")}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                isRequired
                label={t("products_field_name")}
                value={form.name}
                onValueChange={(v) => updateField("name", v)}
              />
              <Input
                description={t("products_slug_hint")}
                label={t("products_field_slug")}
                value={form.slug}
                onValueChange={(v) => updateField("slug", v)}
              />
              <Textarea
                label={t("products_field_description")}
                minRows={4}
                value={form.description}
                onValueChange={(v) => updateField("description", v)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  isRequired
                  endContent={
                    <span className="text-default-400 text-sm">
                      {common("currency")}
                    </span>
                  }
                  label={t("products_field_price")}
                  type="number"
                  value={String(form.price)}
                  onValueChange={(v) => updateField("price", Number(v))}
                />
                <Input
                  endContent={
                    <span className="text-default-400 text-sm">kg</span>
                  }
                  label={t("products_field_weight")}
                  type="number"
                  value={String(form.weight)}
                  onValueChange={(v) => updateField("weight", Number(v))}
                />
              </div>
            </CardBody>
          </Card>

          {/* Images */}
          <Card className="border border-divider">
            <CardHeader>
              <h2 className="font-semibold text-lg">{t("products_images")}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {images.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={`Product ${i + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-divider"
                        src={img.startsWith("http") ? img : `/${img}`}
                      />
                      <button
                        className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          setImages((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <input
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  type="file"
                  onChange={handleImageUpload}
                />
                <Button
                  as="label"
                  className="cursor-pointer"
                  color="primary"
                  htmlFor="image-upload"
                  isLoading={uploading}
                  size="sm"
                  variant="flat"
                >
                  {t("products_upload_image")}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Variants */}
          <Card className="border border-divider">
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">
                {t("products_variants")}
              </h2>
              <Button
                color="primary"
                size="sm"
                variant="flat"
                onPress={addVariant}
              >
                {t("products_add_variant")}
              </Button>
            </CardHeader>
            <CardBody className="space-y-4">
              {form.variants.length === 0 ? (
                <p className="text-default-500 text-sm text-center py-4">
                  {t("products_no_variants")}
                </p>
              ) : (
                form.variants.map((variant, i) => (
                  <div key={i}>
                    {i > 0 && <Divider className="mb-4" />}
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          label={t("products_variant_name")}
                          size="sm"
                          value={variant.name}
                          onValueChange={(v) => updateVariant(i, "name", v)}
                        />
                        <Input
                          endContent={
                            <span className="text-default-400 text-xs">
                              {common("currency")}
                            </span>
                          }
                          label={t("products_variant_price")}
                          size="sm"
                          type="number"
                          value={String(variant.price)}
                          onValueChange={(v) =>
                            updateVariant(i, "price", Number(v))
                          }
                        />
                        <Input
                          label={t("products_variant_stock")}
                          size="sm"
                          type="number"
                          value={String(variant.stock)}
                          onValueChange={(v) =>
                            updateVariant(i, "stock", Number(v))
                          }
                        />
                      </div>
                      <Button
                        isIconOnly
                        className="mt-6"
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() => removeVariant(i)}
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="border border-divider">
            <CardHeader>
              <h2 className="font-semibold text-lg">{t("products_status")}</h2>
            </CardHeader>
            <CardBody>
              <Select
                label={t("products_field_status")}
                selectedKeys={[form.status]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;

                  if (value) updateField("status", value);
                }}
              >
                <SelectItem key="active">
                  {t("products_status_active")}
                </SelectItem>
                <SelectItem key="draft">
                  {t("products_status_draft")}
                </SelectItem>
              </Select>
            </CardBody>
          </Card>

          {/* Save */}
          <Button
            className="w-full font-semibold"
            color="primary"
            isLoading={saving}
            size="lg"
            variant="shadow"
            onPress={handleSave}
          >
            {isNew ? t("products_create") : t("products_save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

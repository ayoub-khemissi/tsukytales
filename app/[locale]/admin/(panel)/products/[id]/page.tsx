"use client";

import type { ProductTranslations } from "@/types/db.types";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Form } from "@heroui/form";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  weight: number;
  is_active: boolean;
  is_preorder: boolean;
}

const LOCALES = ["fr", "en", "es", "de", "it"] as const;
const LOCALE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
};

const INITIAL_FORM: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  stock: 0,
  weight: 0,
  is_active: false,
  is_preorder: false,
};

export default function ProductEditPage() {
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [translations, setTranslations] = useState<ProductTranslations>({});
  const [langTab, setLangTab] = useState<string>("fr");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [subDates, setSubDates] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(
    null,
  );

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
          stock: data.stock ?? 0,
          weight: data.weight || 0,
          is_active: !!data.is_active,
          is_preorder: !!data.is_preorder,
        });
        setTranslations(data.translations || {});
        setImages(data.images || []);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchSubDates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/subscription-dates");

      if (res.ok) {
        const data = await res.json();

        setSubDates(data.dates || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isNew) fetchProduct();
  }, [isNew, fetchProduct]);

  useEffect(() => {
    fetchSubDates();
  }, [fetchSubDates]);

  const updateField = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
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
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const url = isNew ? "/api/admin/products" : `/api/admin/products/${id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, images, translations }),
      });

      if (res.ok) {
        const data = await res.json();

        if (isNew && data.id) {
          router.push(`/admin/products/${data.id}`);
        } else {
          setSaveStatus("success");
        }
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
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
      <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
        {isNew ? t("products_create_title") : t("products_edit_title")}
      </h1>

      <Form
        validationBehavior="native"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="admin-glass rounded-xl">
              <CardHeader>
                <h2 className="font-heading font-semibold text-lg">
                  {t("products_general")}
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Tabs
                  selectedKey={langTab}
                  size="sm"
                  variant="underlined"
                  onSelectionChange={(key) => setLangTab(key as string)}
                >
                  {LOCALES.map((loc) => (
                    <Tab key={loc} title={LOCALE_LABELS[loc]} />
                  ))}
                </Tabs>

                {langTab === "fr" ? (
                  <>
                    <Input
                      isRequired
                      label={t("products_field_name")}
                      maxLength={200}
                      value={form.name}
                      onValueChange={(v) => updateField("name", v)}
                    />
                    <Textarea
                      label={t("products_field_description")}
                      maxLength={5000}
                      minRows={4}
                      value={form.description}
                      onValueChange={(v) => updateField("description", v)}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label={`${t("products_field_name")} (${LOCALE_LABELS[langTab]})`}
                      maxLength={200}
                      value={
                        translations[langTab as keyof ProductTranslations]
                          ?.name ?? ""
                      }
                      onValueChange={(v) =>
                        setTranslations((prev) => ({
                          ...prev,
                          [langTab]: {
                            ...prev[langTab as keyof ProductTranslations],
                            name: v,
                          },
                        }))
                      }
                    />
                    <Textarea
                      label={`${t("products_field_description")} (${LOCALE_LABELS[langTab]})`}
                      maxLength={5000}
                      minRows={4}
                      value={
                        translations[langTab as keyof ProductTranslations]
                          ?.description ?? ""
                      }
                      onValueChange={(v) =>
                        setTranslations((prev) => ({
                          ...prev,
                          [langTab]: {
                            ...prev[langTab as keyof ProductTranslations],
                            description: v,
                          },
                        }))
                      }
                    />
                  </>
                )}

                <Input
                  description={t("products_slug_hint")}
                  label={t("products_field_slug")}
                  maxLength={200}
                  value={form.slug}
                  onValueChange={(v) => updateField("slug", v)}
                />
                <div className="grid grid-cols-3 gap-4">
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
                    label={t("products_stock")}
                    min={0}
                    type="number"
                    value={String(form.stock)}
                    onValueChange={(v) => updateField("stock", Number(v))}
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
            <Card className="admin-glass rounded-xl">
              <CardHeader>
                <h2 className="font-heading font-semibold text-lg">
                  {t("products_images")}
                </h2>
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
                        <Button
                          isIconOnly
                          className="absolute -top-2 -right-2 min-w-5 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          color="danger"
                          radius="full"
                          size="sm"
                          variant="solid"
                          onPress={() =>
                            setImages((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          x
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <input
                    multiple
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="admin-glass rounded-xl">
              <CardHeader>
                <h2 className="font-heading font-semibold text-lg">
                  {t("products_status")}
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Switch
                  isSelected={form.is_active}
                  onValueChange={(v) => updateField("is_active", v)}
                >
                  {t("products_is_active")}
                </Switch>
                <Switch
                  isSelected={form.is_preorder}
                  onValueChange={(v) => updateField("is_preorder", v)}
                >
                  {t("products_is_preorder")}
                </Switch>
              </CardBody>
            </Card>

            {/* Subscription dates — read-only info */}
            <Card className="admin-glass rounded-xl">
              <CardHeader>
                <h2 className="font-heading font-semibold text-lg">
                  {t("sub_dates_title")}
                </h2>
              </CardHeader>
              <CardBody className="space-y-3">
                {subDates.length > 0 ? (
                  <ul className="space-y-1">
                    {subDates.map((d) => (
                      <li key={d} className="text-sm text-default-600">
                        {new Date(d + "T00:00:00").toLocaleDateString("fr-FR")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-default-400">
                    {t("sub_dates_empty")}
                  </p>
                )}
                <Button
                  as={Link}
                  color="primary"
                  href="/admin/settings"
                  size="sm"
                  variant="flat"
                >
                  {t("sub_dates_go_settings")}
                </Button>
              </CardBody>
            </Card>

            {/* Save */}
            <Button
              className="w-full font-semibold"
              color="primary"
              isLoading={saving}
              size="lg"
              type="submit"
              variant="shadow"
            >
              {isNew ? t("products_create") : t("products_save")}
            </Button>
            {saveStatus === "success" && (
              <Chip
                className="w-full max-w-full py-4 text-center"
                color="success"
                variant="flat"
              >
                {t("products_saved")}
              </Chip>
            )}
            {saveStatus === "error" && (
              <Chip
                className="w-full max-w-full py-4 text-center"
                color="danger"
                variant="flat"
              >
                {t("products_save_error")}
              </Chip>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}

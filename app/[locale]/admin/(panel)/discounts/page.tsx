"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { useTranslations } from "next-intl";

interface Discount {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  usage_count: number;
  max_usage: number | null;
  expires_at: string | null;
  is_active: boolean;
}

interface DiscountsResponse {
  items: Discount[];
  total: number;
  page: number;
  limit: number;
}

export default function DiscountsPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Create form state
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState("");
  const [formMaxUsage, setFormMaxUsage] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
  const [deleting, setDeleting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/admin/discounts?${params}`);
      if (res.ok) {
        const data: DiscountsResponse = await res.json();
        setDiscounts(data.items || []);
        setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const resetForm = () => {
    setFormCode("");
    setFormType("percentage");
    setFormValue("");
    setFormMaxUsage("");
    setFormExpiresAt("");
  };

  const handleCreate = async (onClose: () => void) => {
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        code: formCode.trim().toUpperCase(),
        type: formType,
        value: Number(formValue),
      };
      if (formMaxUsage) body.max_usage = Number(formMaxUsage);
      if (formExpiresAt) body.expires_at = formExpiresAt;

      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        resetForm();
        onClose();
        fetchDiscounts();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (onClose: () => void) => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/discounts/${deleteId}`, { method: "DELETE" });
      onClose();
      fetchDiscounts();
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatValue = (discount: Discount) => {
    if (discount.type === "percentage") {
      return `${discount.value}%`;
    }
    return `${Number(discount.value).toFixed(2)}${common("currency")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("discounts_title")}</h1>
        <Button color="primary" onPress={onOpen}>
          {t("discounts_add")}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      ) : discounts.length === 0 ? (
        <p className="text-center text-default-500 py-20">{t("discounts_empty")}</p>
      ) : (
        <>
          {/* Table header */}
          <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-4 py-2 text-sm font-semibold text-default-500 border-b border-divider">
            <span>{t("discounts_code")}</span>
            <span>{t("discounts_type")}</span>
            <span>{t("discounts_value")}</span>
            <span>{t("discounts_usage")}</span>
            <span>{t("discounts_expires")}</span>
            <span>{t("discounts_active")}</span>
            <span className="text-right">{t("orders_actions")}</span>
          </div>

          {/* Discount rows */}
          <div className="space-y-2">
            {discounts.map((discount) => (
              <Card key={discount.id} className="border border-divider">
                <CardBody className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-3 lg:gap-4 items-center">
                    {/* Code */}
                    <div>
                      <span className="font-mono font-bold text-foreground">{discount.code}</span>
                    </div>

                    {/* Type */}
                    <div>
                      <Chip size="sm" variant="flat" color={discount.type === "percentage" ? "secondary" : "primary"}>
                        {discount.type === "percentage" ? t("discounts_type_percentage") : t("discounts_type_fixed")}
                      </Chip>
                    </div>

                    {/* Value */}
                    <div className="font-semibold">
                      {formatValue(discount)}
                    </div>

                    {/* Usage */}
                    <div className="text-sm text-default-600">
                      {discount.usage_count} / {discount.max_usage ?? "∞"}
                    </div>

                    {/* Expires */}
                    <div className="text-sm text-default-500">
                      {discount.expires_at
                        ? new Date(discount.expires_at).toLocaleDateString()
                        : "—"}
                    </div>

                    {/* Active */}
                    <div>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={discount.is_active ? "success" : "default"}
                      >
                        {discount.is_active ? t("discounts_active") : "Inactive"}
                      </Chip>
                    </div>

                    {/* Actions */}
                    <div className="lg:text-right">
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => {
                          setDeleteId(discount.id);
                          onDeleteOpen();
                        }}
                      >
                        {common("delete")}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                color="primary"
                showControls
              />
            </div>
          )}
        </>
      )}

      {/* Create discount modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t("discounts_add")}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label={t("discounts_code")}
                  placeholder="SUMMER25"
                  value={formCode}
                  onValueChange={setFormCode}
                  isRequired
                />
                <Select
                  label={t("discounts_type")}
                  selectedKeys={[formType]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as "percentage" | "fixed";
                    if (val) setFormType(val);
                  }}
                  isRequired
                >
                  <SelectItem key="percentage">{t("discounts_type_percentage")}</SelectItem>
                  <SelectItem key="fixed">{t("discounts_type_fixed")}</SelectItem>
                </Select>
                <Input
                  label={t("discounts_value")}
                  type="number"
                  placeholder={formType === "percentage" ? "25" : "10.00"}
                  value={formValue}
                  onValueChange={setFormValue}
                  endContent={
                    <span className="text-default-400 text-sm">
                      {formType === "percentage" ? "%" : common("currency")}
                    </span>
                  }
                  isRequired
                />
                <Input
                  label={t("discounts_max_usage")}
                  type="number"
                  placeholder="100"
                  value={formMaxUsage}
                  onValueChange={setFormMaxUsage}
                />
                <Input
                  label={t("discounts_expires")}
                  type="date"
                  placeholder="YYYY-MM-DD"
                  value={formExpiresAt}
                  onValueChange={setFormExpiresAt}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {common("cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={creating}
                  isDisabled={!formCode.trim() || !formValue}
                  onPress={() => handleCreate(onClose)}
                >
                  {common("confirm")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{common("confirm")}</ModalHeader>
              <ModalBody>
                <p>{t("discounts_deleted")}?</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {common("cancel")}
                </Button>
                <Button
                  color="danger"
                  isLoading={deleting}
                  onPress={() => handleDelete(onClose)}
                >
                  {common("delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

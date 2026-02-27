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
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { useTranslations } from "next-intl";

import { AdminTableFilters } from "@/components/admin/AdminTableFilters";
import {
  SortableColumn,
  type SortDirection,
} from "@/components/admin/SortableColumn";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const limit = 20;

  // Create form state
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [formValue, setFormValue] = useState("");
  const [formMaxUsage, setFormMaxUsage] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const [deleting, setDeleting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy && sortDirection) {
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortDirection);
      }

      const res = await fetch(`/api/admin/discounts?${params}`);

      if (res.ok) {
        const data: DiscountsResponse = await res.json();

        setDiscounts(data.items || []);
        setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortDirection]);

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

  const handleSort = (column: string, direction: SortDirection) => {
    setSortBy(direction ? column : null);
    setSortDirection(direction);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
          {t("discounts_title")}
        </h1>
        <Button color="primary" onPress={onOpen}>
          {t("discounts_add")}
        </Button>
      </div>

      {/* Filters */}
      <AdminTableFilters
        filters={[
          {
            key: "status",
            label: t("discounts_filter_status"),
            options: [
              { key: "all", label: t("filter_all") },
              { key: "active", label: t("discounts_active") },
              { key: "inactive", label: t("discounts_inactive") },
            ],
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
          },
        ]}
        search={{
          value: search,
          placeholder: t("discounts_search"),
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
      ) : discounts.length === 0 ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("discounts_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label={t("discounts_title")}>
              <TableHeader>
                <TableColumn>
                  <SortableColumn
                    column="code"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("discounts_code")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("discounts_type")}</TableColumn>
                <TableColumn>{t("discounts_value")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="usage_count"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("discounts_usage")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="ends_at"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("discounts_expires")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("discounts_active")}</TableColumn>
                <TableColumn>{t("orders_actions")}</TableColumn>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <span className="font-mono font-bold">
                        {discount.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          discount.type === "percentage"
                            ? "secondary"
                            : "primary"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {discount.type === "percentage"
                          ? t("discounts_type_percentage")
                          : t("discounts_type_fixed")}
                      </Chip>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatValue(discount)}
                    </TableCell>
                    <TableCell className="text-default-600">
                      {discount.usage_count} / {discount.max_usage ?? "∞"}
                    </TableCell>
                    <TableCell className="text-default-500">
                      {discount.expires_at
                        ? new Date(discount.expires_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={discount.is_active ? "success" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {discount.is_active
                          ? t("discounts_active")
                          : t("discounts_inactive")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Button
                        color="danger"
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          setDeleteId(discount.id);
                          onDeleteOpen();
                        }}
                      >
                        {common("delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
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

      {/* Create discount modal */}
      <Modal isOpen={isOpen} placement="center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t("discounts_add")}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  isRequired
                  label={t("discounts_code")}
                  placeholder="SUMMER25"
                  value={formCode}
                  onValueChange={setFormCode}
                />
                <Select
                  isRequired
                  label={t("discounts_type")}
                  selectedKeys={[formType]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as "percentage" | "fixed";

                    if (val) setFormType(val);
                  }}
                >
                  <SelectItem key="percentage">
                    {t("discounts_type_percentage")}
                  </SelectItem>
                  <SelectItem key="fixed">
                    {t("discounts_type_fixed")}
                  </SelectItem>
                </Select>
                <Input
                  isRequired
                  endContent={
                    <span className="text-default-400 text-sm">
                      {formType === "percentage" ? "%" : common("currency")}
                    </span>
                  }
                  label={t("discounts_value")}
                  placeholder={formType === "percentage" ? "25" : "10.00"}
                  type="number"
                  value={formValue}
                  onValueChange={setFormValue}
                />
                <Input
                  label={t("discounts_max_usage")}
                  placeholder="100"
                  type="number"
                  value={formMaxUsage}
                  onValueChange={setFormMaxUsage}
                />
                <Input
                  label={t("discounts_expires")}
                  placeholder="YYYY-MM-DD"
                  type="date"
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
                  isDisabled={!formCode.trim() || !formValue}
                  isLoading={creating}
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
      <Modal
        isOpen={isDeleteOpen}
        placement="center"
        onOpenChange={onDeleteOpenChange}
      >
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

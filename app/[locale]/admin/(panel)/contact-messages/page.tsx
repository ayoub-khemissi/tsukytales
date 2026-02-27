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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { useTranslations } from "next-intl";

import { AdminTableFilters } from "@/components/admin/AdminTableFilters";
import {
  SortableColumn,
  type SortDirection,
} from "@/components/admin/SortableColumn";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  createdAt: string;
}

const STATUS_COLOR_MAP: Record<string, "warning" | "default" | "success"> = {
  unread: "warning",
  read: "default",
  replied: "success",
};

export default function ContactMessagesPage() {
  const t = useTranslations("admin");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const limit = 20;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("size", String(limit));
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy && sortDirection) {
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortDirection);
      }

      const res = await fetch(`/api/admin/contact-messages?${params}`);
      const data = await res.json();

      setMessages(data.items || []);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortDirection]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleView = async (msg: ContactMessage) => {
    setSelected(msg);
    if (msg.status === "unread") {
      await fetch(`/api/admin/contact-messages/${msg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m)),
      );
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/admin/contact-messages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: status as ContactMessage["status"] } : m,
      ),
    );
    if (selected?.id === id) {
      setSelected({ ...selected, status: status as ContactMessage["status"] });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("messages_delete_confirm"))) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/contact-messages/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } finally {
      setDeleting(null);
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
      <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
        {t("messages_title")}
      </h1>

      {/* Filters */}
      <AdminTableFilters
        filters={[
          {
            key: "status",
            label: t("messages_col_status"),
            options: [
              { key: "all", label: t("messages_filter_all") },
              { key: "unread", label: t("messages_status_unread") },
              { key: "read", label: t("messages_status_read") },
              { key: "replied", label: t("messages_status_replied") },
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
          placeholder: t("messages_search"),
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
      ) : messages.length === 0 ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("messages_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label={t("messages_title")}>
              <TableHeader>
                <TableColumn>
                  <SortableColumn
                    column="createdAt"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("messages_col_date")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("messages_col_name")}</TableColumn>
                <TableColumn>{t("messages_col_email")}</TableColumn>
                <TableColumn>{t("messages_col_subject")}</TableColumn>
                <TableColumn>{t("messages_col_status")}</TableColumn>
                <TableColumn>{t("messages_col_actions")}</TableColumn>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow
                    key={msg.id}
                    className={
                      msg.status === "unread" ? "font-semibold" : undefined
                    }
                  >
                    <TableCell className="text-default-500">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{msg.name}</TableCell>
                    <TableCell className="text-default-600">
                      {msg.email}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {msg.subject}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={STATUS_COLOR_MAP[msg.status] || "default"}
                        size="sm"
                        variant="flat"
                      >
                        {t(`messages_status_${msg.status}`)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          color="primary"
                          size="sm"
                          variant="flat"
                          onPress={() => handleView(msg)}
                        >
                          {t("messages_view")}
                        </Button>
                        <Button
                          color="danger"
                          isLoading={deleting === msg.id}
                          size="sm"
                          variant="flat"
                          onPress={() => handleDelete(msg.id)}
                        >
                          {t("messages_delete")}
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

      {/* Detail modal */}
      <Modal isOpen={!!selected} size="2xl" onClose={() => setSelected(null)}>
        <ModalContent>
          {selected && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span>{selected.subject}</span>
                <span className="text-sm font-normal text-default-500">
                  {selected.name} &lt;{selected.email}&gt; —{" "}
                  {new Date(selected.createdAt).toLocaleString()}
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selected.message}
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Select
                    className="w-[160px]"
                    selectedKeys={[selected.status]}
                    size="sm"
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] as string;

                      handleStatusChange(selected.id, val);
                    }}
                  >
                    <SelectItem key="unread">
                      {t("messages_status_unread")}
                    </SelectItem>
                    <SelectItem key="read">
                      {t("messages_status_read")}
                    </SelectItem>
                    <SelectItem key="replied">
                      {t("messages_status_replied")}
                    </SelectItem>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    color="danger"
                    isLoading={deleting === selected.id}
                    size="sm"
                    variant="flat"
                    onPress={() => handleDelete(selected.id)}
                  >
                    {t("messages_delete")}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setSelected(null)}
                  >
                    {t("messages_close")}
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

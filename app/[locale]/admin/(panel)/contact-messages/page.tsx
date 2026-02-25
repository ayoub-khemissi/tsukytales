"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { useTranslations } from "next-intl";

import { SearchIcon } from "@/components/icons";

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
  const limit = 20;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("size", String(limit));
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/contact-messages?${params}`);
      const data = await res.json();

      setMessages(data.items || []);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">{t("messages_title")}</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          isClearable
          className="max-w-md"
          placeholder={t("messages_search")}
          startContent={<SearchIcon className="text-default-400" />}
          value={search}
          onClear={() => setSearch("")}
          onValueChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Select
          className="max-w-[200px]"
          selectedKeys={[statusFilter]}
          size="md"
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as string;

            setStatusFilter(val);
            setPage(1);
          }}
        >
          <SelectItem key="all">{t("messages_filter_all")}</SelectItem>
          <SelectItem key="unread">{t("messages_status_unread")}</SelectItem>
          <SelectItem key="read">{t("messages_status_read")}</SelectItem>
          <SelectItem key="replied">{t("messages_status_replied")}</SelectItem>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : messages.length === 0 ? (
        <p className="text-center text-default-500 py-20">
          {t("messages_empty")}
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider text-left text-default-500">
                  <th className="pb-3 pr-4 font-medium">
                    {t("messages_col_date")}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {t("messages_col_name")}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {t("messages_col_email")}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {t("messages_col_subject")}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {t("messages_col_status")}
                  </th>
                  <th className="pb-3 font-medium">
                    {t("messages_col_actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`border-b border-divider/50 hover:bg-default-50 transition-colors ${
                      msg.status === "unread" ? "font-semibold" : ""
                    }`}
                  >
                    <td className="py-3 pr-4 text-default-500">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">{msg.name}</td>
                    <td className="py-3 pr-4 text-default-600">{msg.email}</td>
                    <td className="py-3 pr-4 max-w-[300px] truncate">
                      {msg.subject}
                    </td>
                    <td className="py-3 pr-4">
                      <Chip
                        color={STATUS_COLOR_MAP[msg.status] || "default"}
                        size="sm"
                        variant="flat"
                      >
                        {t(`messages_status_${msg.status}`)}
                      </Chip>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button
                          color="primary"
                          size="sm"
                          variant="light"
                          onPress={() => handleView(msg)}
                        >
                          {t("messages_view")}
                        </Button>
                        <Button
                          color="danger"
                          isLoading={deleting === msg.id}
                          size="sm"
                          variant="light"
                          onPress={() => handleDelete(msg.id)}
                        >
                          {t("messages_delete")}
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
            {messages.map((msg) => (
              <Card
                key={msg.id}
                isPressable
                className={`border border-divider hover:border-primary/50 transition-colors ${
                  msg.status === "unread" ? "border-warning/50" : ""
                }`}
                onPress={() => handleView(msg)}
              >
                <CardBody className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{msg.name}</span>
                    <Chip
                      color={STATUS_COLOR_MAP[msg.status] || "default"}
                      size="sm"
                      variant="flat"
                    >
                      {t(`messages_status_${msg.status}`)}
                    </Chip>
                  </div>
                  <p className="text-sm text-default-600">{msg.email}</p>
                  <p className="text-sm font-medium truncate">{msg.subject}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-default-500">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
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

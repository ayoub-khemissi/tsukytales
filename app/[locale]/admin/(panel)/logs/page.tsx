"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
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

import { AdminTableFilters } from "@/components/admin/AdminTableFilters";
import {
  SortableColumn,
  type SortDirection,
} from "@/components/admin/SortableColumn";

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
}

const levelColorMap: Record<string, "danger" | "warning" | "primary"> = {
  error: "danger",
  warn: "warning",
  info: "primary",
};

export default function LogsPage() {
  const t = useTranslations("admin");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (levelFilter !== "all") params.set("level", levelFilter);
      if (sortBy && sortDirection) {
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortDirection);
      }

      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();

      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, levelFilter, sortBy, sortDirection]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSort = (column: string, direction: SortDirection) => {
    setSortBy(direction ? column : null);
    setSortDirection(direction);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
        {t("logs_title")}
      </h1>

      {/* Filters */}
      <AdminTableFilters
        filters={[
          {
            key: "level",
            label: t("logs_filter_level"),
            options: [
              { key: "all", label: t("filter_all") },
              { key: "error", label: "Error" },
              { key: "warn", label: "Warning" },
              { key: "info", label: "Info" },
            ],
            value: levelFilter,
            onChange: (v) => {
              setLevelFilter(v);
              setPage(1);
            },
          },
        ]}
        search={{
          value: search,
          placeholder: t("logs_search"),
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
        }}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("logs_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table aria-label={t("logs_title")}>
              <TableHeader>
                <TableColumn>
                  <SortableColumn
                    column="level"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("logs_level")}
                    onSort={handleSort}
                  />
                </TableColumn>
                <TableColumn>{t("logs_message")}</TableColumn>
                <TableColumn>
                  <SortableColumn
                    column="timestamp"
                    currentDirection={sortDirection}
                    currentSort={sortBy}
                    label={t("logs_timestamp")}
                    onSort={handleSort}
                  />
                </TableColumn>
              </TableHeader>
              <TableBody>
                {logs.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip
                        color={levelColorMap[entry.level] || "default"}
                        size="sm"
                        variant="flat"
                      >
                        {entry.level.toUpperCase()}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{entry.message}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-default-500">
                        {(() => {
                          const d = new Date(entry.timestamp);

                          return isNaN(d.getTime())
                            ? entry.timestamp
                            : d.toLocaleString();
                        })()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
    </div>
  );
}

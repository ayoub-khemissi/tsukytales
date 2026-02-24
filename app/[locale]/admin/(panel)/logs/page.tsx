"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
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

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("logs_title")}</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="border border-divider">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("logs_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <Table aria-label={t("logs_title")}>
          <TableHeader>
            <TableColumn>{t("logs_level")}</TableColumn>
            <TableColumn>{t("logs_message")}</TableColumn>
            <TableColumn>{t("logs_timestamp")}</TableColumn>
          </TableHeader>
          <TableBody>
            {logs.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Chip
                    color={levelColorMap[entry.level] || "default"}
                    variant="flat"
                    size="sm"
                  >
                    {entry.level.toUpperCase()}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{entry.message}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-default-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

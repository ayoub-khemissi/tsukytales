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

interface Subscription {
  id: string;
  customer_email: string;
  plan_name: string;
  status: "active" | "canceled" | "past_due";
  next_billing_date: string;
}

const statusColorMap: Record<string, "success" | "danger" | "warning"> = {
  active: "success",
  canceled: "danger",
  past_due: "warning",
};

export default function SubscriptionsPage() {
  const t = useTranslations("admin");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const limit = 20;

  const fetchSubscriptions = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/subscriptions?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        setSubscriptions(data.items || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCancel = async (id: string) => {
    setCancelingId(id);
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}/cancel`, {
        method: "POST",
      });

      if (res.ok) {
        fetchSubscriptions();
      }
    } finally {
      setCancelingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("subscriptions_title")}</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : subscriptions.length === 0 ? (
        <Card className="border border-divider">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("subscriptions_empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <Table aria-label={t("subscriptions_title")} className="mb-6">
            <TableHeader>
              <TableColumn>{t("subscriptions_email")}</TableColumn>
              <TableColumn>{t("subscriptions_plan")}</TableColumn>
              <TableColumn>{t("subscriptions_status")}</TableColumn>
              <TableColumn>{t("subscriptions_next_billing")}</TableColumn>
              <TableColumn>{t("subscriptions_actions")}</TableColumn>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.customer_email}</TableCell>
                  <TableCell>{sub.plan_name}</TableCell>
                  <TableCell>
                    <Chip
                      color={statusColorMap[sub.status] || "default"}
                      size="sm"
                      variant="flat"
                    >
                      {t(`subscriptions_status_${sub.status}`)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {new Date(sub.next_billing_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {sub.status === "active" && (
                      <Button
                        color="danger"
                        isLoading={cancelingId === sub.id}
                        size="sm"
                        variant="flat"
                        onPress={() => handleCancel(sub.id)}
                      >
                        {t("subscriptions_cancel")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center">
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

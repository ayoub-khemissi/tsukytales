"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

interface FinancialReport {
  revenue: number;
  orders_count: number;
  average_order: number;
  refunds: number;
  net_revenue: number;
}

export default function FinancesPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/financial-report")
      .then((r) => r.json())
      .then((data) => setReport(data))
      .finally(() => setLoading(false));
  }, []);

  const statCards = report
    ? [
        {
          label: t("finances_revenue"),
          value: `${report.revenue.toFixed(2)}${common("currency")}`,
        },
        {
          label: t("finances_orders_count"),
          value: String(report.orders_count),
        },
        {
          label: t("finances_average_order"),
          value: `${report.average_order.toFixed(2)}${common("currency")}`,
        },
        {
          label: t("finances_refunds"),
          value: `${report.refunds.toFixed(2)}${common("currency")}`,
        },
        {
          label: t("finances_net_revenue"),
          value: `${report.net_revenue.toFixed(2)}${common("currency")}`,
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("finances_title")}</h1>
        <Button
          as={Link}
          href="/api/admin/financial-report?export=xlsx"
          color="primary"
          variant="flat"
        >
          {t("finances_export")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      ) : !report ? (
        <Card className="border border-divider">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("finances_no_data")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border border-divider">
              <CardBody className="p-6">
                <p className="text-sm text-default-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

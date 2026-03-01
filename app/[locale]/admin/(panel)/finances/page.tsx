"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";

import { downloadCSV } from "@/lib/utils/export-csv";

interface MonthlyTrend {
  month: string;
  revenue: number;
  orders_count: number;
}

interface FinancialReport {
  revenue: number;
  orders_count: number;
  average_order: number;
  refunds: number;
  net_revenue: number;
  subscription_revenue: number;
  oneoff_revenue: number;
  subscription_count: number;
  pending_amount: number;
  pending_count: number;
  discount_total: number;
  churned_count: number;
  churn_rate: number;
  mrr: number;
  monthly_trend: MonthlyTrend[];
}

const PERIODS = [1, 3, 6, 12, 0] as const;

export default function FinancesPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [months, setMonths] = useState(6);

  const periodLabels: Record<number, string> = {
    1: t("finances_period_1m"),
    3: t("finances_period_3m"),
    6: t("finances_period_6m"),
    12: t("finances_period_12m"),
    0: t("finances_period_all"),
  };

  const fetchReport = useCallback((m: number) => {
    setLoading(true);
    const params = m > 0 ? `?months=${m}` : "?months=120";

    fetch(`/api/admin/financial-report${params}`)
      .then((r) => r.json())
      .then((data) => setReport(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReport(months);
  }, [months, fetchReport]);

  const handleExportCSV = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const headers = [
        t("finances_revenue"),
        t("finances_subscription_revenue"),
        t("finances_oneoff_revenue"),
        t("finances_net_revenue"),
        t("finances_orders_count"),
        t("finances_average_order"),
        t("finances_pending"),
        t("finances_refunds"),
        t("finances_discounts"),
        t("finances_subscription_count"),
        t("finances_churn"),
        t("finances_mrr"),
      ];

      const rows = [
        [
          report.revenue.toFixed(2),
          report.subscription_revenue.toFixed(2),
          report.oneoff_revenue.toFixed(2),
          report.net_revenue.toFixed(2),
          String(report.orders_count),
          report.average_order.toFixed(2),
          `${report.pending_amount.toFixed(2)} (${report.pending_count})`,
          report.refunds.toFixed(2),
          report.discount_total.toFixed(2),
          String(report.subscription_count),
          `${report.churned_count} (${report.churn_rate.toFixed(1)}%)`,
          report.mrr.toFixed(2),
        ],
      ];

      if (report.monthly_trend.length > 0) {
        rows.push([]);
        rows.push([
          t("finances_month"),
          t("finances_revenue"),
          t("finances_orders_count"),
        ]);
        for (const row of report.monthly_trend) {
          rows.push([
            row.month,
            row.revenue.toFixed(2),
            String(row.orders_count),
          ]);
        }
      }

      const periodSuffix = months > 0 ? `${months}m` : "all";

      downloadCSV(
        `finances-${periodSuffix}-${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        rows,
      );
    } finally {
      setExporting(false);
    }
  };

  const cur = common("currency");

  const revenueCards = report
    ? [
        {
          label: t("finances_revenue"),
          value: `${report.revenue.toFixed(2)}${cur}`,
        },
        {
          label: t("finances_subscription_revenue"),
          value: `${report.subscription_revenue.toFixed(2)}${cur}`,
        },
        {
          label: t("finances_oneoff_revenue"),
          value: `${report.oneoff_revenue.toFixed(2)}${cur}`,
        },
        {
          label: t("finances_net_revenue"),
          value: `${report.net_revenue.toFixed(2)}${cur}`,
        },
      ]
    : [];

  const ordersCards = report
    ? [
        {
          label: t("finances_orders_count"),
          value: String(report.orders_count),
        },
        {
          label: t("finances_average_order"),
          value: `${report.average_order.toFixed(2)}${cur}`,
        },
        {
          label: t("finances_pending"),
          value: `${report.pending_amount.toFixed(2)}${cur} (${report.pending_count})`,
        },
        {
          label: t("finances_refunds"),
          value: `${report.refunds.toFixed(2)}${cur}`,
        },
      ]
    : [];

  const promoCards = report
    ? [
        {
          label: t("finances_discounts"),
          value: `${report.discount_total.toFixed(2)}${cur}`,
        },
        {
          label: t("finances_subscription_count"),
          value: String(report.subscription_count),
        },
        {
          label: t("finances_churn"),
          value: `${report.churned_count} (${report.churn_rate.toFixed(1)}%)`,
        },
        {
          label: t("finances_mrr"),
          value: `${report.mrr.toFixed(2)}${cur}`,
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading italic text-2xl font-bold text-text-brand dark:text-white">
          {t("finances_title")}
        </h1>
        <Button
          color="primary"
          isLoading={exporting}
          size="sm"
          variant="flat"
          onPress={handleExportCSV}
        >
          {t("export_csv")}
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <Button
            key={p}
            color={months === p ? "primary" : "default"}
            size="sm"
            variant={months === p ? "solid" : "flat"}
            onPress={() => setMonths(p)}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : !report ? (
        <Card className="admin-glass rounded-xl">
          <CardBody className="py-16 text-center">
            <p className="text-default-500">{t("finances_no_data")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Revenue section */}
          <section>
            <h2 className="text-lg font-semibold mb-3 text-text-brand dark:text-white">
              {t("finances_revenue")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {revenueCards.map((stat) => (
                <Card key={stat.label} className="admin-glass rounded-xl">
                  <CardBody className="p-5">
                    <p className="text-sm text-default-500 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>

          {/* Orders section */}
          <section>
            <h2 className="text-lg font-semibold mb-3 text-text-brand dark:text-white">
              {t("finances_orders_count")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ordersCards.map((stat) => (
                <Card key={stat.label} className="admin-glass rounded-xl">
                  <CardBody className="p-5">
                    <p className="text-sm text-default-500 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>

          {/* Promos section */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {promoCards.map((stat) => (
                <Card key={stat.label} className="admin-glass rounded-xl">
                  <CardBody className="p-5">
                    <p className="text-sm text-default-500 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>

          {/* Monthly trend table */}
          {report.monthly_trend.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-text-brand dark:text-white">
                {t("finances_monthly_trend")}
              </h2>
              <Card className="admin-glass rounded-xl overflow-hidden">
                <CardBody className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-default-200">
                        <th className="text-left p-3 font-medium text-default-500">
                          {t("finances_month")}
                        </th>
                        <th className="text-right p-3 font-medium text-default-500">
                          {t("finances_revenue")}
                        </th>
                        <th className="text-right p-3 font-medium text-default-500">
                          {t("finances_orders_count")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.monthly_trend.map((row) => (
                        <tr
                          key={row.month}
                          className="border-b border-default-100 last:border-0"
                        >
                          <td className="p-3">{row.month}</td>
                          <td className="p-3 text-right font-medium">
                            {row.revenue.toFixed(2)}
                            {cur}
                          </td>
                          <td className="p-3 text-right">{row.orders_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

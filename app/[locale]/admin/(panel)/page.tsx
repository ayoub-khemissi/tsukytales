"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

interface RecentOrder {
  id: number;
  total: number;
  status: string;
  createdAt: string;
}

interface DailySale {
  date: string;
  total: number;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: RecentOrder[];
  dailySales: DailySale[];
}

const statusColorMap: Record<
  string,
  "warning" | "success" | "danger" | "primary" | "default"
> = {
  pending: "warning",
  processing: "primary",
  shipped: "primary",
  delivered: "success",
  cancelled: "danger",
  refunded: "danger",
};

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-default-500">{tc("error")}</p>
      </div>
    );
  }

  const currency = tc("currency");
  const maxSale = Math.max(...stats.dailySales.map((d) => d.total), 1);

  const statCards = [
    {
      label: t("dashboard_total_revenue"),
      value: `${stats.totalRevenue.toFixed(2)} ${currency}`,
      icon: (
        <svg
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <line x1="12" x2="12" y1="1" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: t("dashboard_total_orders"),
      value: stats.totalOrders.toString(),
      icon: (
        <svg
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" x2="12" y1="22.08" y2="12" />
        </svg>
      ),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("dashboard_total_customers"),
      value: stats.totalCustomers.toString(),
      icon: (
        <svg
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: t("dashboard_total_products"),
      value: stats.totalProducts.toString(),
      icon: (
        <svg
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("dashboard_pending_orders"),
      value: stats.pendingOrders.toString(),
      icon: (
        <svg
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: t("dashboard_low_stock"),
      value: stats.lowStockProducts.toString(),
      icon: (
        <svg
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" x2="12" y1="9" y2="13" />
          <line x1="12" x2="12.01" y1="17" y2="17" />
        </svg>
      ),
      color: "text-danger",
      bg: "bg-danger/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold">{t("dashboard_title")}</h1>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border border-divider">
            <CardBody className="flex flex-row items-center gap-4 py-5">
              <div
                className={`${card.bg} ${card.color} p-3 rounded-xl shrink-0`}
              >
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-default-500">{card.label}</p>
                <p className="text-2xl font-bold truncate">{card.value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Bottom section: Recent Orders + Sales Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border border-divider">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold">
              {t("dashboard_recent_orders")}
            </h2>
          </CardHeader>
          <CardBody className="gap-0 px-0 pt-0">
            {stats.recentOrders.length === 0 ? (
              <p className="text-default-500 text-sm px-4 py-6 text-center">
                {t("orders_empty")}
              </p>
            ) : (
              <div className="divide-y divide-divider">
                {stats.recentOrders.slice(0, 10).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-default-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Link
                        className="text-sm font-medium text-primary hover:underline"
                        href={`/admin/orders/${order.id}`}
                      >
                        #{order.id}
                      </Link>
                      <Chip
                        color={statusColorMap[order.status] || "default"}
                        size="sm"
                        variant="flat"
                      >
                        {order.status}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-medium">
                        {order.total.toFixed(2)} {currency}
                      </span>
                      <span className="text-xs text-default-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Sales Chart */}
        <Card className="border border-divider">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold">
              {t("dashboard_sales_chart")}
            </h2>
          </CardHeader>
          <CardBody>
            {stats.dailySales.length === 0 ? (
              <p className="text-default-500 text-sm text-center py-6">
                {t("orders_empty")}
              </p>
            ) : (
              <div className="flex items-end gap-2" style={{ height: 220 }}>
                {stats.dailySales.map((day) => {
                  const barH = Math.max(
                    Math.round((day.total / maxSale) * 140),
                    4,
                  );
                  const amount =
                    day.total >= 1000
                      ? `${(day.total / 1000).toFixed(1)}k`
                      : `${Math.round(day.total)}`;

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center justify-end group h-full min-w-0"
                    >
                      {/* Amount label */}
                      <span className="text-[10px] font-medium text-default-600 mb-1 truncate max-w-full">
                        {amount}
                        {currency}
                      </span>
                      {/* Bar */}
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-primary to-secondary transition-all duration-300 min-w-[6px] group-hover:from-primary/80 group-hover:to-secondary/80"
                        style={{ height: barH }}
                      />
                      {/* Date label */}
                      <span className="text-[9px] text-default-400 leading-none mt-1.5 hidden sm:block">
                        {new Date(day.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

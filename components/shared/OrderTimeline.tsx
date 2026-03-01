"use client";

import { useTranslations } from "next-intl";

interface HistoryEntry {
  date: string;
  status: string;
  label?: string;
}

interface OrderTimelineProps {
  history: HistoryEntry[];
}

const STATUS_DOT_COLOR: Record<string, string> = {
  created: "bg-blue-400",
  payment_confirmed: "bg-green-500",
  shipped: "bg-blue-500",
  reshipped: "bg-blue-500",
  delivered: "bg-green-600",
  canceled: "bg-red-500",
  refunded: "bg-red-400",
  partially_refunded: "bg-yellow-500",
};

export default function OrderTimeline({ history }: OrderTimelineProps) {
  const t = useTranslations("common");

  if (history.length === 0) {
    return (
      <p className="text-default-500 text-sm">{t("order_history_empty")}</p>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-default-200" />

      <div className="space-y-4">
        {history.map((entry, i) => {
          const dotColor = STATUS_DOT_COLOR[entry.status] || "bg-default-400";

          // Resolve label: try i18n key, fallback to entry.label, fallback to status
          const i18nKey = `order_history_${entry.status}` as any;
          let label: string;

          try {
            label = t(i18nKey);
            // next-intl returns the key itself if not found
            if (label === i18nKey) {
              label = entry.label || entry.status;
            }
          } catch {
            label = entry.label || entry.status;
          }

          return (
            <div key={i} className="relative flex gap-3 items-start">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-1 w-[11px] h-[11px] rounded-full border-2 border-white dark:border-zinc-900 ${dotColor} shrink-0 z-10`}
              />

              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-default-400">
                  {new Date(entry.date).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

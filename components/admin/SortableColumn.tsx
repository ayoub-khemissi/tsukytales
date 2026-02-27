"use client";

import { Button } from "@heroui/button";

export type SortDirection = "asc" | "desc" | null;

interface SortableColumnProps {
  label: string;
  column: string;
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (column: string, direction: SortDirection) => void;
}

export function SortableColumn({
  label,
  column,
  currentSort,
  currentDirection,
  onSort,
}: SortableColumnProps) {
  const isActive = currentSort === column;

  const handleClick = () => {
    if (!isActive) {
      onSort(column, "asc");
    } else if (currentDirection === "asc") {
      onSort(column, "desc");
    } else {
      onSort(column, null);
    }
  };

  return (
    <Button
      className="bg-transparent p-0 min-w-0 h-auto gap-1 text-tiny font-semibold text-foreground-500 data-[hover=true]:text-foreground"
      size="sm"
      variant="light"
      onPress={handleClick}
    >
      {label}
      <span className="inline-flex flex-col leading-none text-[10px]">
        <span
          className={
            isActive && currentDirection === "asc"
              ? "text-primary"
              : "text-default-300"
          }
        >
          ▲
        </span>
        <span
          className={
            isActive && currentDirection === "desc"
              ? "text-primary"
              : "text-default-300"
          }
        >
          ▼
        </span>
      </span>
    </Button>
  );
}

"use client";

import { Spinner } from "@heroui/spinner";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-32">
      <Spinner size="lg" color="primary" />
    </div>
  );
}

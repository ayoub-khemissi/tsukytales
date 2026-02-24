"use client";

import { Spinner } from "@heroui/spinner";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-32">
      <Spinner color="primary" size="lg" />
    </div>
  );
}

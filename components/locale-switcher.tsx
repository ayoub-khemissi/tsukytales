"use client";

import { useLocale } from "next-intl";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";

import { usePathname, useRouter } from "@/i18n/navigation";

const locales = [
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "it", label: "IT", flag: "🇮🇹" },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const current = locales.find((l) => l.code === locale) || locales[0];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button className="min-w-0 px-2 text-primary" size="sm" variant="light">
          <span>{current.flag}</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language"
        selectedKeys={new Set([locale])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;

          router.replace(pathname, { locale: selected });
        }}
      >
        {locales.map((l) => (
          <DropdownItem key={l.code} textValue={l.label}>
            <span className="flex items-center gap-2">
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

"use client";

import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

import { SearchIcon } from "@/components/icons";

export interface FilterConfig {
  key: string;
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface AdminTableFiltersProps {
  search?: {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
  };
  filters?: FilterConfig[];
}

export function AdminTableFilters({ search, filters }: AdminTableFiltersProps) {
  if (!search && (!filters || filters.length === 0)) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {search && (
        <Input
          isClearable
          className="max-w-md"
          placeholder={search.placeholder}
          startContent={<SearchIcon className="text-default-400" />}
          value={search.value}
          onClear={() => search.onChange("")}
          onValueChange={search.onChange}
        />
      )}
      {filters?.map((filter) => (
        <Select
          key={filter.key}
          aria-label={filter.label}
          className="max-w-[200px]"
          selectedKeys={[filter.value]}
          size="md"
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as string;

            filter.onChange(val);
          }}
        >
          {filter.options.map((opt) => (
            <SelectItem key={opt.key}>{opt.label}</SelectItem>
          ))}
        </Select>
      ))}
    </div>
  );
}

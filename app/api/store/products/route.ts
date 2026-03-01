import type { ProductTranslations } from "@/types/db.types";

import { NextRequest, NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/errors/handler";
import { productRepository } from "@/lib/repositories/product.repository";
import { settingsRepository } from "@/lib/repositories/settings.repository";
import { cached, cacheKey } from "@/lib/cache";

const SUPPORTED_LOCALES = new Set(["fr", "en", "es", "de", "it"]);

function localizeProducts<T extends Record<string, unknown>>(
  items: T[],
  locale: string,
): T[] {
  if (locale === "fr") {
    return items.map(({ translations: _, ...rest }) => rest as T);
  }

  return items.map((item) => {
    const translations = item.translations as ProductTranslations | null;
    const t = translations?.[locale as keyof ProductTranslations];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { translations: _, ...rest } = item;

    return {
      ...rest,
      ...(t?.name ? { name: t.name } : {}),
      ...(t?.description ? { description: t.description } : {}),
    } as T;
  });
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? undefined;
  const size = searchParams.get("size") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const locale = searchParams.get("locale") ?? "fr";

  const subscriptionPage = searchParams.get("subscription_page");

  const safeLocale = SUPPORTED_LOCALES.has(locale) ? locale : "fr";

  const data = await cached(
    cacheKey("products:list", {
      page,
      size,
      search,
      locale: safeLocale,
      subscriptionPage,
    }),
    300,
    async () => {
      const notDeleted = "(is_deleted = 0 OR is_deleted IS NULL)";
      let where: string | undefined;

      if (subscriptionPage === "true") {
        where = `is_active = 1 AND ${notDeleted}`;
      } else {
        where = notDeleted;
      }

      const result = search
        ? await productRepository.search(
            search,
            page ? Number(page) : undefined,
            size ? Number(size) : undefined,
          )
        : await productRepository.findAndCountAll({
            where,
            orderBy: "createdAt DESC",
            page,
            size,
          });

      const response: Record<string, unknown> = {
        ...result,
        items: localizeProducts(result.items, safeLocale),
      };

      if (subscriptionPage === "true") {
        response.subscription_dates =
          (await settingsRepository.get<string[]>("subscription_dates")) ?? [];
        response.show_product_detail =
          (await settingsRepository.get<boolean>("show_product_detail")) ??
          true;
      }

      return response;
    },
  );

  return NextResponse.json(data);
});

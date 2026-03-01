import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { productRepository } from "@/lib/repositories/product.repository";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tsukytales.com";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/subscription",
  "/subscribe",
  "/contact",
  "/legal",
  "/privacy",
  "/terms",
];

function buildLocalePath(locale: string, path: string) {
  const cleanPath = path === "/" ? "" : path;

  if (locale === routing.defaultLocale) return `${BASE_URL}${cleanPath}`;

  return `${BASE_URL}/${locale}${cleanPath}`;
}

function buildLanguages(path: string) {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = buildLocalePath(locale, path);
  }

  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap(
    (route) => {
      return routing.locales.map((locale) => ({
        url: buildLocalePath(locale, route),
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: route === "/" ? 1.0 : 0.8,
        alternates: { languages: buildLanguages(route) },
      }));
    },
  );

  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const products = await productRepository.findAll({
      where: "is_active = 1 AND (is_deleted = 0 OR is_deleted IS NULL)",
    });

    productEntries = products.flatMap((product) => {
      const path = `/product/${product.slug}`;

      return routing.locales.map((locale) => ({
        url: buildLocalePath(locale, path),
        lastModified: product.updatedAt ?? new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: { languages: buildLanguages(path) },
      }));
    });
  } catch {
    // DB unavailable at build time — skip product entries
  }

  return [...staticEntries, ...productEntries];
}

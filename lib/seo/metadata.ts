import { routing } from "@/i18n/routing";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tsukytales.com";

export const OG_IMAGE_URL = `${BASE_URL}/og-image.jpg`;

function buildLocalePath(locale: string, path: string) {
  const cleanPath = path === "/" ? "" : path;

  if (locale === routing.defaultLocale) return `${BASE_URL}${cleanPath}`;

  return `${BASE_URL}/${locale}${cleanPath}`;
}

export function buildAlternates(path: string) {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = buildLocalePath(locale, path);
  }

  return {
    canonical: buildLocalePath(routing.defaultLocale, path),
    languages,
  };
}

import "@/styles/globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
import { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import clsx from "clsx";

import { Providers } from "./providers";

import { fontSans, fontSerif } from "@/config/fonts";
import { routing } from "@/i18n/routing";
import { buildAlternates, OG_IMAGE_URL } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  const localeMap: Record<string, string> = {
    fr: "fr_FR",
    en: "en_US",
    es: "es_ES",
    de: "de_DE",
    it: "it_IT",
  };

  return {
    title: {
      default: t("home_title"),
      template: "%s | Tsuky Tales",
    },
    description: t("home_description"),
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || "https://tsukytales.com",
    ),
    icons: { icon: "/favicon.ico" },
    openGraph: {
      type: "website",
      siteName: "Tsuky Tales",
      locale: localeMap[locale] ?? "fr_FR",
      alternateLocale: Object.entries(localeMap)
        .filter(([k]) => k !== locale)
        .map(([, v]) => v),
      url: process.env.NEXT_PUBLIC_BASE_URL || "https://tsukytales.com",
      title: t("home_title"),
      description: t("home_description"),
      images: [{ url: OG_IMAGE_URL, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("home_title"),
      description: t("home_description"),
      images: [OG_IMAGE_URL],
    },
    robots: { index: true, follow: true },
    alternates: buildAlternates("/"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfaff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0a1f" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tsuky Tales",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://tsukytales.com",
    logo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://tsukytales.com"}/favicon.ico`,
    sameAs: ["https://www.instagram.com/tsukytales"],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tsuky Tales",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://tsukytales.com",
  };

  return (
    <html suppressHydrationWarning lang={locale}>
      <head>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
      </head>
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
          fontSerif.variable,
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import "@/styles/globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
import { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import clsx from "clsx";

import { Providers } from "./providers";
import { fontSans, fontSerif } from "@/config/fonts";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: {
    default: "Tsuky Tales — Créateur d'imaginaires",
    template: "%s | Tsuky Tales",
  },
  description: "Livres illustrés uniques et abonnements littéraires. Tsuky Tales éveille l'imagination des petits et des grands.",
  metadataBase: new URL("https://tsukytales.com"),
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "Tsuky Tales",
    locale: "fr_FR",
    alternateLocale: ["en_US", "es_ES", "de_DE", "it_IT"],
    url: "https://tsukytales.com",
    title: "Tsuky Tales — Créateur d'imaginaires",
    description: "Livres illustrés uniques et abonnements littéraires. Tsuky Tales éveille l'imagination des petits et des grands.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tsuky Tales — Créateur d'imaginaires",
    description: "Livres illustrés uniques et abonnements littéraires.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://tsukytales.com",
    languages: {
      fr: "https://tsukytales.com",
      en: "https://tsukytales.com/en",
      es: "https://tsukytales.com/es",
      de: "https://tsukytales.com/de",
      it: "https://tsukytales.com/it",
    },
  },
};

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

  return (
    <html suppressHydrationWarning lang={locale}>
      <head />
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

import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildAlternates } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    title: t("terms_title"),
    description: t("terms_description"),
    openGraph: {
      title: `${t("terms_title")} | Tsuky Tales`,
      description: t("terms_description"),
    },
    alternates: buildAlternates("/terms"),
  };
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

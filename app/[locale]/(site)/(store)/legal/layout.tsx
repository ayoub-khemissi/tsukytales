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
    title: t("legal_title"),
    description: t("legal_description"),
    openGraph: {
      title: `${t("legal_title")} | Tsuky Tales`,
      description: t("legal_description"),
    },
    alternates: buildAlternates("/legal"),
  };
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

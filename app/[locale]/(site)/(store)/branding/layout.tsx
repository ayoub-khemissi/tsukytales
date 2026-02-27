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
    title: t("branding_title"),
    description: t("branding_description"),
    openGraph: {
      title: `${t("branding_title")} | Tsuky Tales`,
      description: t("branding_description"),
    },
    alternates: buildAlternates("/branding"),
  };
}

export default function BrandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

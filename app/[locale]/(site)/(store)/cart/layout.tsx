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
    title: t("cart_title"),
    description: t("cart_description"),
    openGraph: {
      title: `${t("cart_title")} | Tsuky Tales`,
      description: t("cart_description"),
    },
    alternates: buildAlternates("/cart"),
    robots: { index: false },
  };
}

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

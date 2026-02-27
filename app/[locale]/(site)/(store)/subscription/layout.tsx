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
    title: t("subscription_title"),
    description: t("subscription_description"),
    openGraph: {
      title: `${t("subscription_title")} | Tsuky Tales`,
      description: t("subscription_description"),
    },
    alternates: buildAlternates("/subscription"),
  };
}

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

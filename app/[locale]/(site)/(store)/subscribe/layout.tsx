import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    title: t("subscribe_title"),
    description: t("subscribe_description"),
    robots: { index: false },
    openGraph: {
      title: `${t("subscribe_title")} | Tsuky Tales`,
      description: t("subscribe_description"),
    },
  };
}

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

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
    title: t("account_title"),
    description: t("account_description"),
    robots: { index: false },
    openGraph: {
      title: `${t("account_title")} | Tsuky Tales`,
      description: t("account_description"),
    },
  };
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

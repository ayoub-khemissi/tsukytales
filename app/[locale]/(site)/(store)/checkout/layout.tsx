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
    title: t("checkout_title"),
    description: t("checkout_description"),
    robots: { index: false },
    openGraph: {
      title: `${t("checkout_title")} | Tsuky Tales`,
      description: t("checkout_description"),
    },
  };
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

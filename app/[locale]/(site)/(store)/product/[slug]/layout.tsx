import { Metadata } from "next";

import { productRepository } from "@/lib/repositories/product.repository";
import { buildAlternates, OG_IMAGE_URL } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  const product = await productRepository.findBySlug(slug);

  if (!product) return {};

  const translation =
    locale !== "fr" &&
    product.translations?.[locale as "en" | "es" | "de" | "it"];
  const name = (translation && translation.name) || product.name;
  const description =
    (translation && translation.description) || product.description || "";

  const path = `/product/${slug}`;

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | Tsuky Tales`,
      description,
      images: product.image
        ? [{ url: product.image }]
        : [{ url: OG_IMAGE_URL, width: 1200, height: 630 }],
    },
    alternates: buildAlternates(path),
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  const product = await productRepository.findBySlug(slug);

  if (!product) return <>{children}</>;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.image ?? undefined,
    brand: {
      "@type": "Brand",
      name: "Tsuky Tales",
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EUR",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `https://tsukytales.com/product/${slug}`,
    },
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      {children}
    </>
  );
}

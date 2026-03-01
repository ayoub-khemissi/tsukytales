import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/cart",
          "/checkout",
          "/account",
          "/api/",
          "/en/admin",
          "/en/cart",
          "/en/checkout",
          "/en/account",
          "/es/admin",
          "/es/cart",
          "/es/checkout",
          "/es/account",
          "/de/admin",
          "/de/cart",
          "/de/checkout",
          "/de/account",
          "/it/admin",
          "/it/cart",
          "/it/checkout",
          "/it/account",
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || "https://tsukytales.com"}/sitemap.xml`,
  };
}

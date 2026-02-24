import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Explore our collection of unique illustrated books. Find your next favorite read at Tsuky Tales.",
  openGraph: {
    title: "Shop | Tsuky Tales",
    description: "Explore our collection of unique illustrated books.",
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

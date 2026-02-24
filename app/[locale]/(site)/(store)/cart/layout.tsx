import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your cart and proceed to checkout.",
  openGraph: {
    title: "Cart | Tsuky Tales",
    description: "Review your cart and proceed to checkout.",
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

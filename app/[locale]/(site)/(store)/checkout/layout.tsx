import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order securely with Stripe.",
  robots: { index: false },
  openGraph: {
    title: "Checkout | Tsuky Tales",
    description: "Complete your order securely with Stripe.",
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

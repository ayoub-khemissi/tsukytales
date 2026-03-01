import { Metadata } from "next";

export const metadata: Metadata = {
  title: "S'abonner",
  description: "Finalisez votre abonnement trimestriel Tsuky Tales.",
  robots: { index: false },
  openGraph: {
    title: "S'abonner | Tsuky Tales",
    description: "Finalisez votre abonnement trimestriel Tsuky Tales.",
  },
};

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "S'abonner - Box littéraire Tsuky Tales | Formules mensuelle & trimestrielle",
  description:
    "Abonnez-vous à la box littéraire Tsuky Tales. Formules mensuelle et trimestrielle avec livres collectors et éditions exclusives livrés chez vous.",
  openGraph: {
    title: "S'abonner | Tsuky Tales",
    description:
      "Abonnez-vous à la box littéraire Tsuky Tales. Formules mensuelle et trimestrielle avec livres collectors et éditions exclusives livrés chez vous.",
  },
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

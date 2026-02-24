import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notre Histoire",
  description:
    "Découvrez l'histoire de Tsuky Tales, la maison d'édition passionnée qui crée des boxes littéraires collectors et des éditions exclusives pour les amoureux des livres.",
  openGraph: {
    title: "Notre Histoire | Tsuky Tales",
    description:
      "Découvrez l'histoire de Tsuky Tales, la maison d'édition passionnée qui crée des boxes littéraires collectors.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

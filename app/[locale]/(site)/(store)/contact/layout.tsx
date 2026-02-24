import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Tsuky Tales team. We'd love to hear from you.",
  openGraph: {
    title: "Contact | Tsuky Tales",
    description:
      "Get in touch with the Tsuky Tales team. We'd love to hear from you.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

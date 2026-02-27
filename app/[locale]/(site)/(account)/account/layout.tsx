import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your Tsuky Tales account and orders.",
  robots: { index: false },
  openGraph: {
    title: "My Account | Tsuky Tales",
    description: "Manage your Tsuky Tales account and orders.",
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Tsuky Tales account and start exploring.",
  openGraph: {
    title: "Sign Up | Tsuky Tales",
    description: "Create your Tsuky Tales account and start exploring.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your Tsuky Tales account.",
  robots: { index: false },
  openGraph: {
    title: "Login | Tsuky Tales",
    description: "Log in to your Tsuky Tales account.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

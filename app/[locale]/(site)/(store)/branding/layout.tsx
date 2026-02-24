import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branding",
  description: "Tsuky Tales brand kit — banners, visual resources, and brand identity.",
  openGraph: {
    title: "Branding | Tsuky Tales",
    description: "Tsuky Tales brand kit — banners, visual resources, and brand identity.",
  },
};

export default function BrandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

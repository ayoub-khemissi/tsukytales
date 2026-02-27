export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Tsuky Tales",
  description:
    "Créateur d'imaginaires — Livres illustrés et abonnements littéraires",
  navItems: [
    { label: "Accueil", href: "/" },
    { label: "Boutique", href: "/boutique" },
    { label: "Abonnement", href: "/abonnement" },
    { label: "Contact", href: "/contact" },
    { label: "À propos", href: "/a-propos" },
  ],
  navMenuItems: [
    { label: "Accueil", href: "/" },
    { label: "Boutique", href: "/boutique" },
    { label: "Abonnement", href: "/abonnement" },
    { label: "Contact", href: "/contact" },
    { label: "À propos", href: "/a-propos" },
    { label: "Mon espace client", href: "/compte" },
    { label: "Panier", href: "/panier" },
  ],
};

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tsuky Tales",
    short_name: "Tsuky Tales",
    description:
      "Livres illustrés uniques et abonnements littéraires. Tsuky Tales éveille l'imagination des petits et des grands.",
    start_url: "/",
    display: "standalone",
    theme_color: "#581668",
    background_color: "#fdfaff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}

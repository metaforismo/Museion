import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Museion",
    short_name: "Museion",
    description: "Source-grounded interactive learning with deterministic truth and a Socratic tutor.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6fa",
    theme_color: "#131c31",
  };
}

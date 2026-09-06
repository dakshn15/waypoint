import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/contact", "/packages"],
      disallow: ["/dashboard/", "/api/", "/trip-builder/", "/login", "/register", "/forgot-password", "/reset-password"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

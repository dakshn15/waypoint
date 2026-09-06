import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const packages = await prisma.package.findMany({
    where: { status: "PUBLISHED", agency: { active: true } },
    select: { id: true, updatedAt: true },
  });

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/packages`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...packages.map((pkg) => ({ url: `${baseUrl}/packages/${pkg.id}`, lastModified: pkg.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}

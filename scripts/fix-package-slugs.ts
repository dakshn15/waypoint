/**
 * Migration script: Regenerate slugs for existing packages that have
 * ID-based slugs (cuid format). Run once via: npx tsx scripts/fix-package-slugs.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const packages = await prisma.package.findMany({
    select: { id: true, title: true, slug: true },
  });

  let fixed = 0;
  const cuidPattern = /^c[a-z0-9]{20,}$/; // matches cuid-style IDs

  for (const pkg of packages) {
    // Skip packages that already have proper slugs (not cuid-like)
    if (pkg.slug && !cuidPattern.test(pkg.slug)) {
      continue;
    }

    const newSlug = `${pkg.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${Date.now().toString().slice(-4)}`;

    try {
      await prisma.package.update({
        where: { id: pkg.id },
        data: { slug: newSlug },
      });
      console.log(`✅ ${pkg.title}: ${pkg.slug} → ${newSlug}`);
      fixed++;
    } catch (err: any) {
      // Handle unique constraint collision — append more entropy
      const fallbackSlug = `${newSlug}-${Math.floor(Math.random() * 1000)}`;
      try {
        await prisma.package.update({
          where: { id: pkg.id },
          data: { slug: fallbackSlug },
        });
        console.log(`✅ ${pkg.title}: ${pkg.slug} → ${fallbackSlug} (fallback)`);
        fixed++;
      } catch (err2) {
        console.error(`❌ Failed to update slug for "${pkg.title}":`, err2);
      }
    }
  }

  console.log(`\nDone. Fixed ${fixed} of ${packages.length} packages.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

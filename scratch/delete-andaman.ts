import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pkg = await prisma.package.findFirst({
    where: { slug: "andaman-island-getaway" },
  });

  if (!pkg) {
    console.log("✅ Package 'Andaman Island Getaway' not found in DB — already deleted or never seeded.");
    return;
  }

  console.log(`Found package: ${pkg.title} (id: ${pkg.id})`);

  // Delete related favorites first
  const favCount = await prisma.favorite.deleteMany({ where: { packageId: pkg.id } });
  console.log(`   Deleted ${favCount.count} favorites`);

  // Delete related notifications that reference this package
  const notifCount = await prisma.notification.deleteMany({
    where: { data: { path: ["packageSlug"], equals: "andaman-island-getaway" } },
  });
  console.log(`   Deleted ${notifCount.count} notifications`);

  // Delete the package itself
  await prisma.package.delete({ where: { id: pkg.id } });
  console.log(`🗑️  Deleted package: ${pkg.title}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

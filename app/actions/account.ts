"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function createAgencyForCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("You must be logged in to create an agency.");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, agency: { select: { id: true } } },
  });
  if (!user || user.role !== "TRAVELER" || user.agency) {
    throw new Error("This account cannot be converted into an agency.");
  }

  const baseSlug = user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agency";
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: "AGENCY" } }),
    prisma.agency.create({
      data: {
        name: user.name,
        slug: `${baseSlug}-${user.id.substring(0, 5)}`,
        ownerId: user.id,
        email: user.email,
      },
    }),
  ]);
}

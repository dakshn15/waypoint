import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { serializePrisma } from "@/lib/utils";
import EditPackageClient from "./edit-client";

interface EditPackagePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPackagePage({ params }: EditPackagePageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      itineraries: {
        orderBy: { dayNumber: "asc" },
        include: {
          activities: true,
          hotel: true,
        },
      },
    },
  });

  if (!pkg) notFound();

  // Verify this package belongs to this agency owner
  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!agency || pkg.agencyId !== agency.id) {
    redirect("/dashboard/packages");
  }

  return (
    <EditPackageClient
      packageId={pkg.id}
      initialData={serializePrisma({
        title: pkg.title,
        description: pkg.description || "",
        duration: String(pkg.duration),
        maxGroupSize: pkg.maxGroupSize ? String(pkg.maxGroupSize) : "",
        difficulty: pkg.difficulty,
        destinations: Array.isArray(pkg.destinations)
          ? (pkg.destinations as any[]).map((d: any) =>
              typeof d === "string" ? d : d.country ? `${d.name}, ${d.country}` : d.name
            )
          : [],
        inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions as string[] : [],
        exclusions: Array.isArray(pkg.exclusions) ? pkg.exclusions as string[] : [],
        basePrice: String(Number(pkg.basePrice)),
        currency: pkg.currency,
        imageUrl: pkg.images?.[0] || "",
        itineraries: (pkg.itineraries || []).map((it) => ({
          dayNumber: it.dayNumber,
          title: it.title,
          description: it.description || "",
          hotelName: it.hotel?.name || "",
          activities: (it.activities || []).map((act) => ({
            time: act.time || "",
            duration: act.duration || "",
            type: act.type || "SIGHTSEEING",
            title: act.title,
            description: act.description || "",
            location: act.location || "",
          })),
        })),
      })}
    />
  );
}

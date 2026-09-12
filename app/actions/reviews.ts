"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function submitReview(data: {
  packageId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: "You must be signed in to submit a review." };
  }

  if (!data.packageId) {
    return { error: "Package ID is required." };
  }

  const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5)));

  // Ensure target package exists
  const pkg = await prisma.package.findUnique({
    where: { id: data.packageId },
    select: { id: true, slug: true },
  });

  if (!pkg) {
    return { error: "Package not found." };
  }

  try {
    const review = await prisma.review.upsert({
      where: {
        userId_packageId: {
          userId: session.user.id,
          packageId: pkg.id,
        },
      },
      create: {
        userId: session.user.id,
        packageId: pkg.id,
        rating,
        title: data.title?.trim() || null,
        comment: data.comment?.trim() || null,
        images: data.images || [],
      },
      update: {
        rating,
        title: data.title?.trim() || null,
        comment: data.comment?.trim() || null,
        images: data.images || [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    revalidatePath("/packages");
    revalidatePath(`/packages/${pkg.id}`);
    if (pkg.slug) {
      revalidatePath(`/packages/${pkg.slug}`);
    }

    return { success: true, review };
  } catch (err: any) {
    console.error("[SUBMIT_REVIEW_ERROR]", err);
    return { error: err.message || "Failed to submit review." };
  }
}

export async function deleteReview(reviewId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: "You must be signed in to delete a review." };
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { package: { select: { id: true, slug: true } } },
    });

    if (!review) {
      return { error: "Review not found." };
    }

    const isAuthor = review.userId === session.user.id;
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return { error: "You are not authorized to delete this review." };
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    revalidatePath("/packages");
    revalidatePath(`/packages/${review.package.id}`);
    if (review.package.slug) {
      revalidatePath(`/packages/${review.package.slug}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("[DELETE_REVIEW_ERROR]", err);
    return { error: err.message || "Failed to delete review." };
  }
}

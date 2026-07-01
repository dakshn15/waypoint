import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: "Package ID is required" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_packageId: {
          userId: session.user.id,
          packageId,
        },
      },
    });

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          packageId,
        },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error: any) {
    console.error("[FAVORITE_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}

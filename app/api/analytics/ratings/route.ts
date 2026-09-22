import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const ratingGroups = await prisma.feedback.groupBy({
      by: ["rating"],
      where: {
        workspaceId,
        rating: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        rating: "asc",
      },
    });

    const ratings = [1, 2, 3, 4, 5].map((rating) => {
      const found = ratingGroups.find(
        (item) => item.rating === rating
      );

      return {
        rating,
        count: found?._count._all ?? 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    console.error("GET /api/analytics/ratings failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch rating analytics",
      },
      { status: 500 }
    );
  }
}
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

    const [
      totalFeedback,
      newFeedback,
      reviewedFeedback,
      resolvedFeedback,
      archivedFeedback,
      ratingResult,
    ] = await Promise.all([
      prisma.feedback.count({
        where: { workspaceId },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          status: "NEW",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          status: "REVIEWED",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          status: "RESOLVED",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          status: "ARCHIVED",
        },
      }),

      prisma.feedback.aggregate({
        where: {
          workspaceId,
          rating: {
            not: null,
          },
        },
        _avg: {
          rating: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalFeedback,
        status: {
          new: newFeedback,
          reviewed: reviewedFeedback,
          resolved: resolvedFeedback,
          archived: archivedFeedback,
        },
        averageRating: ratingResult._avg.rating ?? 0,
      },
    });
  } catch (error) {
    console.error("GET /api/feedback/stats failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch feedback statistics",
      },
      { status: 500 }
    );
  }
}
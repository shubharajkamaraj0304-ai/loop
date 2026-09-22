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
      averageRating,
      positiveFeedback,
      negativeFeedback,
      neutralFeedback,
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

      prisma.feedback.count({
        where: {
          workspaceId,
          sentiment: "POSITIVE",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          sentiment: "NEGATIVE",
        },
      }),

      prisma.feedback.count({
        where: {
          workspaceId,
          sentiment: "NEUTRAL",
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
        averageRating: averageRating._avg.rating ?? 0,
        sentiment: {
          positive: positiveFeedback,
          negative: negativeFeedback,
          neutral: neutralFeedback,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard analytics",
      },
      { status: 500 }
    );
  }
}
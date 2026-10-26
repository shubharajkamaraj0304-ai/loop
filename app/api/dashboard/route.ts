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

    console.log("Dashboard workspaceId:", workspaceId);

    // =========================
    // FEEDBACK COUNTS
    // =========================

    const totalFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
      },
    });

    const newFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
        status: "NEW",
      },
    });

    const reviewedFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
        status: "REVIEWED",
      },
    });

    const resolvedFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
        status: "RESOLVED",
      },
    });

    const archivedFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
        status: "ARCHIVED",
      },
    });

    // =========================
    // AVERAGE RATING
    // =========================

    const averageRating = await prisma.feedback.aggregate({
      where: {
        workspaceId,
        rating: {
          not: null,
        },
      },
      _avg: {
        rating: true,
      },
    });

    // =========================
    // SENTIMENT
    // Case-insensitive using Prisma mode
    // =========================

    const positiveFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: {
          equals: "positive",
          mode: "insensitive",
        },
      },
    });

    const negativeFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: {
          equals: "negative",
          mode: "insensitive",
        },
      },
    });

    const neutralFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: {
          equals: "neutral",
          mode: "insensitive",
        },
      },
    });

    // =========================
    // RESPONSE
    // =========================

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
    console.error("=================================");
    console.error("GET /api/dashboard FAILED");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard analytics",
      },
      { status: 500 }
    );
  }
}
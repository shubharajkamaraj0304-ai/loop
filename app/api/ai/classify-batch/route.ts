import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  UserRole,
} from "@/app/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { canAnalyze } from "@/app/lib/auth/permissions";
import { classifyFeedback } from "@/app/lib/ai/classifier";
export async function POST(request: NextRequest) {
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

    // Only ADMIN and ANALYST can classify feedback.
    if (!canAnalyze(session.user.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to classify feedback",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback IDs are required",
        },
        { status: 400 }
      );
    }

    const feedbackIds = ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));

    if (feedbackIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid feedback IDs provided",
        },
        { status: 400 }
      );
    }

    // Prevent extremely large requests.
    if (feedbackIds.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum 50 feedback records can be classified at once",
        },
        { status: 400 }
      );
    }

    // IMPORTANT:
    // workspaceId guarantees tenant isolation.
    const feedback = await prisma.feedback.findMany({
      where: {
        id: {
          in: feedbackIds,
        },
        workspaceId,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (feedback.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No feedback records found",
        },
        { status: 404 }
      );
    }

    // Get themes belonging only to this workspace.
    const themes = await prisma.theme.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (themes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No themes found in this workspace",
        },
        { status: 400 }
      );
    }

    const updatedResults: Array<{
      feedbackId: number;
      sentiment: string;
      sentimentScore: number;
      themes: string[];
      featureArea: string;
      databaseThemes: Array<{
        id: number;
        name: string;
      }>;
    }> = [];

    for (const feedbackItem of feedback) {
      // Run the same local classifier that we already tested.
      const classification = classifyFeedback(feedbackItem.text);

      // Remove previous theme relationships.
      await prisma.feedbackTheme.deleteMany({
        where: {
          feedbackId: feedbackItem.id,
        },
      });

      const databaseThemes: Array<{
        id: number;
        name: string;
      }> = [];

      // Connect detected themes that actually exist
      // in the current workspace.
      for (const themeName of classification.themes) {
        const theme = themes.find(
          (item) =>
            item.name.toLowerCase() ===
            themeName.toLowerCase()
        );

        if (!theme) {
          continue;
        }

        await prisma.feedbackTheme.create({
          data: {
            feedbackId: feedbackItem.id,
            themeId: theme.id,
            confidence: 1,
          },
        });

        databaseThemes.push({
          id: theme.id,
          name: theme.name,
        });
      }

      // Update AI classification fields.
      await prisma.feedback.update({
        where: {
          id: feedbackItem.id,
        },
        data: {
          sentiment: classification.sentiment,
          sentimentScore: classification.sentimentScore,
          featureArea: classification.featureArea,
        },
      });

      updatedResults.push({
        feedbackId: feedbackItem.id,
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        themes: classification.themes,
        featureArea: classification.featureArea,
        databaseThemes,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Feedback batch classified successfully",
      data: {
        requested: feedback.length,
        classified: updatedResults.length,
        results: updatedResults,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/ai/classify-batch failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to classify feedback batch",
      },
      { status: 500 }
    );
  }
}
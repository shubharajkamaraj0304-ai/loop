import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";

function getPercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }

  return Number(
    (((current - previous) / previous) * 100).toFixed(1)
  );
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const requestedPeriod = Number(
      searchParams.get("period") || "30"
    );

    const period = [30, 60, 90].includes(requestedPeriod)
      ? requestedPeriod
      : 30;

    /*
     * Use the latest feedback date as the reference date.
     *
     * This avoids problems when the database/server clock is ahead
     * of the demo feedback dates.
     */
    const latestFeedback = await prisma.feedback.findFirst({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    const currentEnd = latestFeedback?.createdAt ?? new Date();

    const currentStart = new Date(currentEnd);
    currentStart.setDate(
      currentStart.getDate() - period + 1
    );

    const previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(
      previousEnd.getMilliseconds() - 1
    );

    const previousStart = new Date(previousEnd);
    previousStart.setDate(
      previousStart.getDate() - period + 1
    );

    const themes = await prisma.theme.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    const feedbackThemes =
      await prisma.feedbackTheme.findMany({
        where: {
          theme: {
            workspaceId,
          },
        },
        select: {
          themeId: true,
          confidence: true,
          feedback: {
            select: {
              id: true,
              createdAt: true,
              sentiment: true,
            },
          },
        },
      });

    const totalFeedback = await prisma.feedback.count({
      where: {
        workspaceId,
        createdAt: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
    });

    const data = themes.map((theme) => {
      const themeFeedback = feedbackThemes.filter(
        (item) => item.themeId === theme.id
      );

      const currentFeedback = themeFeedback.filter((item) => {
        const createdAt = item.feedback.createdAt;

        return (
          createdAt >= currentStart &&
          createdAt <= currentEnd
        );
      });

      const previousFeedback = themeFeedback.filter((item) => {
        const createdAt = item.feedback.createdAt;

        return (
          createdAt >= previousStart &&
          createdAt <= previousEnd
        );
      });

      const currentCount = currentFeedback.length;
      const previousCount = previousFeedback.length;

      const positive = currentFeedback.filter(
        (item) =>
          item.feedback.sentiment?.toLowerCase() === "positive"
      ).length;

      const negative = currentFeedback.filter(
        (item) =>
          item.feedback.sentiment?.toLowerCase() === "negative"
      ).length;

      const neutral = currentFeedback.filter(
        (item) =>
          item.feedback.sentiment?.toLowerCase() === "neutral"
      ).length;

      const percentageChange = getPercentageChange(
        currentCount,
        previousCount
      );

      const percentageOfFeedback =
        totalFeedback > 0
          ? Number(
              ((currentCount / totalFeedback) * 100).toFixed(1)
            )
          : 0;

      let trend: "up" | "down" | "stable" = "stable";

      if (currentCount > previousCount) {
        trend = "up";
      } else if (currentCount < previousCount) {
        trend = "down";
      }

      const spike =
        previousCount > 0 &&
        currentCount >= previousCount * 1.5;

      return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        currentCount,
        previousCount,
        percentageOfFeedback,
        percentageChange,
        sentiment: {
          positive,
          negative,
          neutral,
        },
        spike,
        trend,
      };
    });

    const themesWithFeedback = data.filter(
      (theme) => theme.currentCount > 0
    ).length;

    const spikes = data.filter(
      (theme) => theme.spike
    ).length;

    return NextResponse.json({
      success: true,

      period: {
        days: period,
        currentStart: currentStart.toISOString(),
        currentEnd: currentEnd.toISOString(),
        previousStart: previousStart.toISOString(),
        previousEnd: previousEnd.toISOString(),
      },

      summary: {
        totalThemes: themes.length,
        totalFeedback,
        themesWithFeedback,
        spikes,
      },

      data,
    });
  } catch (error) {
    console.error(
      "GET /api/analytics/themes failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load theme analytics.",
      },
      { status: 500 }
    );
  }
}
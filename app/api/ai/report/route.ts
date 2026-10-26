import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/lib/auth/auth-options";
import { prisma } from "@/app/lib/prisma";

const reportSchema = z.object({
  period: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30),
});

type SentimentSummary = {
  positive: number;
  negative: number;
  neutral: number;
};

function calculatePercentage(
  value: number,
  total: number
): number {
  if (total === 0) return 0;

  return Number(((value / total) * 100).toFixed(1));
}

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

    const body = await request.json();

    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report period",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { period } = validation.data;
    const workspaceId = session.user.workspaceId;

    const endDate = new Date();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        themes: {
          include: {
            theme: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalFeedback = feedback.length;

    const sentiment: SentimentSummary = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    const themeCounts = new Map<string, number>();

    for (const item of feedback) {
      const itemSentiment = item.sentiment?.toLowerCase();

      if (itemSentiment === "positive") {
        sentiment.positive += 1;
      } else if (itemSentiment === "negative") {
        sentiment.negative += 1;
      } else {
        sentiment.neutral += 1;
      }

      for (const feedbackTheme of item.themes) {
        const themeName = feedbackTheme.theme.name;

        themeCounts.set(
          themeName,
          (themeCounts.get(themeName) ?? 0) + 1
        );
      }
    }

    const topThemes = Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: calculatePercentage(
          count,
          totalFeedback
        ),
      }));

    const representativeQuotes = feedback
      .filter(
        (item) =>
          item.text.trim().length > 0 &&
          item.sentiment?.toLowerCase() === "negative"
      )
      .slice(0, 5)
      .map((item) => ({
        feedbackId: item.id,
        text: item.text,
        sentiment: item.sentiment,
        rating: item.rating,
      }));

    const positiveQuotes = feedback
      .filter(
        (item) =>
          item.text.trim().length > 0 &&
          item.sentiment?.toLowerCase() === "positive"
      )
      .slice(0, 3)
      .map((item) => ({
        feedbackId: item.id,
        text: item.text,
        sentiment: item.sentiment,
        rating: item.rating,
      }));

    const actions: string[] = [];

    if (sentiment.negative > sentiment.positive) {
      actions.push(
        "Prioritize investigation of the main negative feedback themes."
      );
    }

    if (topThemes.length > 0) {
      actions.push(
        `Review the ${topThemes[0].name} theme and identify recurring customer issues.`
      );
    }

    if (sentiment.negative > 0) {
      actions.push(
        "Review negative feedback and assign actionable items to the responsible team."
      );
    }

    if (actions.length === 0) {
      actions.push(
        "Continue monitoring customer feedback and emerging themes."
      );
    }

    const title = `Voice of Customer Report - Last ${period} Days`;

    const content = {
      period,
      periodStart: startDate,
      periodEnd: endDate,
      totalFeedback,
      sentiment: {
        positive: sentiment.positive,
        negative: sentiment.negative,
        neutral: sentiment.neutral,
        positivePercentage: calculatePercentage(
          sentiment.positive,
          totalFeedback
        ),
        negativePercentage: calculatePercentage(
          sentiment.negative,
          totalFeedback
        ),
        neutralPercentage: calculatePercentage(
          sentiment.neutral,
          totalFeedback
        ),
      },
      topThemes,
      representativeQuotes,
      positiveQuotes,
      actions,
    };

    const report = await prisma.report.create({
      data: {
        workspaceId,
        title,
        content: JSON.stringify(content),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        title: report.title,
        ...content,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/ai/report failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate Voice of Customer report",
      },
      { status: 500 }
    );
  }
}
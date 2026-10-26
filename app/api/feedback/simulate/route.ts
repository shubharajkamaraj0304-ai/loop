import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  FeedbackSource,
  FeedbackStatus,
  UserRole,
} from "@/app/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { canAnalyze } from "@/app/lib/auth/permissions";
import { classifyFeedback } from "@/app/lib/ai/classifier";

type SimulatedFeedback = {
  text: string;
  customerName: string;
  customerEmail: string;
  rating: number;
};

const simulatedFeedback: SimulatedFeedback[] = [
  {
    text: "The mobile app is fast and easy to use.",
    customerName: "Emma",
    customerEmail: "emma@simulated.example.com",
    rating: 5,
  },
  {
    text: "Customer support took too long to respond to my issue.",
    customerName: "Daniel",
    customerEmail: "daniel@simulated.example.com",
    rating: 2,
  },
  {
    text: "The delivery arrived earlier than expected. Great service!",
    customerName: "Sophia",
    customerEmail: "sophia@simulated.example.com",
    rating: 5,
  },
  {
    text: "The checkout process is confusing and difficult to understand.",
    customerName: "James",
    customerEmail: "james@simulated.example.com",
    rating: 2,
  },
  {
    text: "The product quality is excellent and matches the description.",
    customerName: "Olivia",
    customerEmail: "olivia@simulated.example.com",
    rating: 5,
  },
  {
    text: "My package was damaged when it arrived.",
    customerName: "William",
    customerEmail: "william@simulated.example.com",
    rating: 2,
  },
  {
    text: "The price is reasonable and the product works well.",
    customerName: "Ava",
    customerEmail: "ava@simulated.example.com",
    rating: 4,
  },
  {
    text: "I had trouble resetting my password.",
    customerName: "Noah",
    customerEmail: "noah@simulated.example.com",
    rating: 3,
  },
];

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

    const userRole = session.user.role as UserRole;

    if (!canAnalyze(userRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to simulate feedback",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const body = await request.json().catch(() => ({}));

    const requestedCount =
      typeof body.count === "number"
        ? Math.floor(body.count)
        : 5;

    const count = Math.min(Math.max(requestedCount, 1), 20);

    const selectedFeedback = Array.from(
      { length: count },
      (_, index) =>
        simulatedFeedback[index % simulatedFeedback.length]
    );

    let imported = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of selectedFeedback) {
        const classification = classifyFeedback(item.text);

        const feedback = await tx.feedback.create({
          data: {
            workspaceId,
            text: item.text,
            channel: "SIMULATED",
            source: FeedbackSource.API,
            status: FeedbackStatus.NEW,
            sentiment: classification.sentiment,
            sentimentScore: classification.sentimentScore,
            featureArea: classification.featureArea,
            rating: item.rating,
            customerName: item.customerName,
            customerEmail: item.customerEmail,
          },
        });

        for (const themeName of classification.themes) {
          const theme = await tx.theme.findFirst({
            where: {
              workspaceId,
              name: themeName,
            },
          });

          if (theme) {
            await tx.feedbackTheme.create({
              data: {
                feedbackId: feedback.id,
                themeId: theme.id,
                confidence: 1,
              },
            });
          }
        }

        imported++;
      }
    });

    return NextResponse.json({
      success: true,
      message: "Simulated channel feedback imported successfully",
      data: {
        imported,
        channel: "SIMULATED",
        source: FeedbackSource.API,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/feedback/simulate failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to import simulated feedback",
      },
      { status: 500 }
    );
  }
}
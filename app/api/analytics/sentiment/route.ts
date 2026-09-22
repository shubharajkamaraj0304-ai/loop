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

    const feedback = await prisma.feedback.groupBy({
      by: ["sentiment"],
      where: {
        workspaceId,
        sentiment: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
    });

    const data = [
      {
        sentiment: "POSITIVE",
        count: 0,
      },
      {
        sentiment: "NEGATIVE",
        count: 0,
      },
      {
        sentiment: "NEUTRAL",
        count: 0,
      },
    ];

    for (const item of feedback) {
      const result = data.find(
        (entry) => entry.sentiment === item.sentiment
      );

      if (result) {
        result.count = item._count._all;
      }
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/analytics/sentiment failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sentiment analytics",
      },
      { status: 500 }
    );
  }
}
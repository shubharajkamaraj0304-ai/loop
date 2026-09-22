import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
export const dynamic = "force-dynamic";
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

    const feedback = await prisma.feedback.findMany({
      where: {
        workspaceId,
      },
      select: {
        createdAt: true,
        themes: {
          select: {
            theme: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const trendMap: Record<
      string,
      {
        date: string;
        themes: Record<string, number>;
      }
    > = {};

    for (const item of feedback) {
      const date = item.createdAt.toISOString().split("T")[0];

      if (!trendMap[date]) {
        trendMap[date] = {
          date,
          themes: {},
        };
      }

      for (const relation of item.themes) {
        const themeName = relation.theme.name;

        if (!trendMap[date].themes[themeName]) {
          trendMap[date].themes[themeName] = 0;
        }

        trendMap[date].themes[themeName]++;
      }
    }

    const data = Object.values(trendMap);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/analytics/themes/trends failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch theme trends",
      },
      { status: 500 }
    );
  }
}
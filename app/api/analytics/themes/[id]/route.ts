import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";

export async function GET(
  request: NextRequest,
  context: {
    params: {
      id: string;
    };
  }
) {
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
    const themeId = Number(context.params.id);

    if (!Number.isInteger(themeId) || themeId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid theme ID",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(
      Number(searchParams.get("page") || "1"),
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit") || "10"),
        1
      ),
      50
    );

    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!theme) {
      return NextResponse.json(
        {
          success: false,
          message: "Theme not found",
        },
        { status: 404 }
      );
    }

    const where = {
      themeId,
      feedback: {
        workspaceId,
      },
    };

    const total = await prisma.feedbackTheme.count({
      where,
    });

    const feedbackThemes =
      await prisma.feedbackTheme.findMany({
        where,
        orderBy: {
          feedback: {
            createdAt: "desc",
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          confidence: true,
          feedback: {
            select: {
              id: true,
              text: true,
              channel: true,
              source: true,
              status: true,
              sentiment: true,
              sentimentScore: true,
              featureArea: true,
              rating: true,
              customerName: true,
              customerEmail: true,
              createdAt: true,
            },
          },
        },
      });

    const feedback = feedbackThemes.map((item) => ({
      ...item.feedback,
      confidence: item.confidence,
    }));

    return NextResponse.json({
      success: true,
      data: {
        theme,
        feedback,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error(
      "GET /api/analytics/themes/[id] failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch theme feedback",
      },
      { status: 500 }
    );
  }
}
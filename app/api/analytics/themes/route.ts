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

    const themes = await prisma.theme.findMany({
      where: {
        workspaceId,
      },
      include: {
        _count: {
          select: {
            feedback: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      feedbackCount: theme._count.feedback,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/analytics/themes failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch theme analytics",
      },
      { status: 500 }
    );
  }
}
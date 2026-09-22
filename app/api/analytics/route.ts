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

    // Theme analytics
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

    // Feedback grouped by status
    const statusGroups = await prisma.feedback.groupBy({
      by: ["status"],
      where: {
        workspaceId,
      },
      _count: {
        _all: true,
      },
    });

    // Feedback grouped by source
    const sourceGroups = await prisma.feedback.groupBy({
      by: ["source"],
      where: {
        workspaceId,
      },
      _count: {
        _all: true,
      },
    });

    const status = statusGroups.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));

    const source = sourceGroups.map((item) => ({
      source: item.source,
      count: item._count._all,
    }));

    return NextResponse.json({
      success: true,
      data: {
        themes: themes.map((theme) => ({
          id: theme.id,
          name: theme.name,
          description: theme.description,
          feedbackCount: theme._count.feedback,
        })),
        status,
        source,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";

// GET all themes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
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

    return NextResponse.json({
      success: true,
      data: themes,
    });
  } catch (error) {
    console.error("GET /api/themes failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch themes" },
      { status: 500 }
    );
  }
}

// POST create theme
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const body = await request.json();

    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Theme name is required" },
        { status: 400 }
      );
    }

    const theme = await prisma.theme.create({
      data: {
        workspaceId,
        name: name.trim(),
        description:
          description && typeof description === "string"
            ? description.trim()
            : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Theme created successfully",
        data: theme,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/themes failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create theme" },
      { status: 500 }
    );
  }
}
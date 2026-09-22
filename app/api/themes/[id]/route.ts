import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";

type RouteContext = {
  params: {
    id: string;
  };
};

// GET single theme
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid theme ID" },
        { status: 400 }
      );
    }

    const theme = await prisma.theme.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        _count: {
          select: {
            feedback: true,
          },
        },
      },
    });

    if (!theme) {
      return NextResponse.json(
        { success: false, message: "Theme not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: theme,
    });
  } catch (error) {
    console.error("GET /api/themes/[id] failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}

// UPDATE theme
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid theme ID" },
        { status: 400 }
      );
    }

    const existingTheme = await prisma.theme.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!existingTheme) {
      return NextResponse.json(
        { success: false, message: "Theme not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Theme name cannot be empty" },
        { status: 400 }
      );
    }

    const theme = await prisma.theme.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && {
          name: name.trim(),
        }),
        ...(description !== undefined && {
          description:
            description === null
              ? null
              : String(description).trim(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Theme updated successfully",
      data: theme,
    });
  } catch (error) {
    console.error("PATCH /api/themes/[id] failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update theme" },
      { status: 500 }
    );
  }
}

// DELETE theme
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid theme ID" },
        { status: 400 }
      );
    }

    const existingTheme = await prisma.theme.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!existingTheme) {
      return NextResponse.json(
        { success: false, message: "Theme not found" },
        { status: 404 }
      );
    }

    await prisma.theme.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Theme deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/themes/[id] failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete theme" },
      { status: 500 }
    );
  }
}
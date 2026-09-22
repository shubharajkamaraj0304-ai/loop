import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { UserRole } from "@/app/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { canAnalyze, isAdmin } from "@/app/lib/auth/permissions";

type RouteContext = {
  params: {
    id: string;
  };
};

// GET single feedback
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

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid feedback ID" },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        themes: {
          include: {
            theme: true,
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: "Feedback not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error("GET /api/feedback/[id] failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// UPDATE feedback
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

    // ADMIN and ANALYST can update feedback
    if (!canAnalyze(session.user.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to update feedback",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid feedback ID" },
        { status: 400 }
      );
    }

    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { success: false, message: "Feedback not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const {
      status,
      sentiment,
      rating,
    } = body;

    const feedback = await prisma.feedback.update({
      where: {
        id,
      },
      data: {
        ...(status !== undefined && { status }),
        ...(sentiment !== undefined && { sentiment }),
        ...(rating !== undefined && {
          rating: rating === null ? null : Number(rating),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feedback updated successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("PATCH /api/feedback/[id] failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update feedback" },
      { status: 500 }
    );
  }
}

// DELETE feedback
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

    // Only ADMIN can delete feedback
    if (!isAdmin(session.user.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to delete feedback",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid feedback ID" },
        { status: 400 }
      );
    }

    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { success: false, message: "Feedback not found" },
        { status: 404 }
      );
    }

    await prisma.feedback.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/feedback/[id] failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { isAdmin } from "@/app/lib/auth/permissions";
import { UserRole } from "@/app/generated/prisma/client";

export async function DELETE(request: NextRequest) {
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

    // Only ADMIN can bulk delete feedback
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

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback IDs are required",
        },
        { status: 400 }
      );
    }

    const feedbackIds = ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));

    if (feedbackIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid feedback IDs provided",
        },
        { status: 400 }
      );
    }

    const result = await prisma.feedback.deleteMany({
      where: {
        id: {
          in: feedbackIds,
        },
        workspaceId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully",
      data: {
        deleted: result.count,
      },
    });
  } catch (error) {
    console.error("DELETE /api/feedback/bulk-delete failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete feedback",
      },
      { status: 500 }
    );
  }
}
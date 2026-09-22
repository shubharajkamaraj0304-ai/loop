import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { canAnalyze } from "@/app/lib/auth/permissions";
import { UserRole } from "@/app/generated/prisma/client";

const validStatuses = [
  "NEW",
  "REVIEWED",
  "RESOLVED",
  "ARCHIVED",
] as const;

export async function PATCH(request: NextRequest) {
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

    // ADMIN and ANALYST can update feedback status
    if (!canAnalyze(session.user.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to update feedback status",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const body = await request.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback IDs are required",
        },
        { status: 400 }
      );
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid feedback status",
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

    const result = await prisma.feedback.updateMany({
      where: {
        id: {
          in: feedbackIds,
        },
        workspaceId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feedback status updated successfully",
      data: {
        updated: result.count,
        status,
      },
    });
  } catch (error) {
    console.error("PATCH /api/feedback/bulk-status failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update feedback status",
      },
      { status: 500 }
    );
  }
}
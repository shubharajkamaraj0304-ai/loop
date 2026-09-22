import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { UserRole } from "@/app/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { canAnalyze } from "@/app/lib/auth/permissions";

// GET all reports
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

    const reports = await prisma.report.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("GET /api/reports failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST create report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ADMIN and ANALYST can create reports
    if (!canAnalyze(session.user.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to create reports",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const body = await request.json();

    const { title, content } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Report title is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, message: "Report content is required" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        workspaceId,
        title: title.trim(),
        content: content.trim(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Report created successfully",
        data: report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reports failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create report" },
      { status: 500 }
    );
  }
}
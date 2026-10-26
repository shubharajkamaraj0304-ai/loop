import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { UserRole } from "@/app/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { canAnalyze } from "@/app/lib/auth/permissions";

// GET single report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID",
        },
        { status: 400 }
      );
    }

    const report = await prisma.report.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("GET /api/reports/[id] failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch report",
      },
      { status: 500 }
    );
  }
}

// PATCH update report
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // ADMIN and ANALYST can update reports
    if (!canAnalyze(session.user.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to update reports",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID",
        },
        { status: 400 }
      );
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : existingReport.title;

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : existingReport.content;

    // Keep existing values if the Edit form sends only one field.
    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Report title is required",
        },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "Report content is required",
        },
        { status: 400 }
      );
    }

    const report = await prisma.report.update({
      where: {
        id,
      },
      data: {
        title,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Report updated successfully",
      data: report,
    });
  } catch (error) {
    console.error("PATCH /api/reports/[id] failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update report",
      },
      { status: 500 }
    );
  }
}

// DELETE report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // ADMIN and ANALYST can delete reports
    if (!canAnalyze(session.user.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to delete reports",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const id = Number(params.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID",
        },
        { status: 400 }
      );
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        id,
        workspaceId,
      },
    });

    if (!existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found",
        },
        { status: 404 }
      );
    }

    await prisma.report.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/reports/[id] failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete report",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const workspaceCount = await prisma.workspace.count();
    const userCount = await prisma.user.count();
    const feedbackCount = await prisma.feedback.count();
    const themeCount = await prisma.theme.count();

    return NextResponse.json({
      success: true,
      message: "LOOP database connection successful",
      data: {
        workspaces: workspaceCount,
        users: userCount,
        feedback: feedbackCount,
        themes: themeCount,
      },
    });
  } catch (error) {
    console.error("Database test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
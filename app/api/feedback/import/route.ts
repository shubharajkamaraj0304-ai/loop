import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parse } from "csv-parse/sync";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";

export async function POST(request: NextRequest) {
  try {
    // Check login
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

    // Get uploaded file
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV file is required",
        },
        { status: 400 }
      );
    }

    // Read CSV
    const csvText = await file.text();

    if (!csvText.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV file is empty",
        },
        { status: 400 }
      );
    }

    // Parse CSV
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    if (records.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No feedback records found in CSV",
        },
        { status: 400 }
      );
    }

    // Convert CSV rows into feedback records
    const feedbackData = records
      .map((row) => {
        const text = row.text || row.feedback || row.comment;

        if (!text?.trim()) {
          return null;
        }

        let rating: number | null = null;

        if (row.rating && !isNaN(Number(row.rating))) {
          rating = Number(row.rating);
        }

        return {
          workspaceId,
          text: text.trim(),
          source: "CSV" as const,
          status: "NEW" as const,
          sentiment: row.sentiment?.trim() || null,
          rating,
          customerName: row.customerName?.trim() || null,
          customerEmail: row.customerEmail?.trim() || null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (feedbackData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid feedback records found",
        },
        { status: 400 }
      );
    }

    // Insert all feedback records
    const result = await prisma.feedback.createMany({
      data: feedbackData,
    });

    return NextResponse.json({
      success: true,
      message: "CSV imported successfully",
      data: {
        imported: result.count,
      },
    });
  } catch (error) {
    console.error("POST /api/feedback/import failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to import CSV",
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parse } from "csv-parse/sync";

import {
  UserRole,
  FeedbackSource,
  FeedbackStatus,
} from "@/app/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { canAnalyze } from "@/app/lib/auth/permissions";
import { classifyFeedback } from "@/app/lib/ai/classifier";

export async function POST(request: NextRequest) {
  try {
    // 1. Check login
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

    // 2. Check permission
    const userRole = session.user.role as UserRole;

    if (!canAnalyze(userRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to import feedback",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;

    // 3. Get uploaded file
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

    // 4. Check file type
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".csv")) {
      return NextResponse.json(
        {
          success: false,
          message: "Only CSV files are allowed",
        },
        { status: 400 }
      );
    }

    // 5. Read CSV
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

    // 6. Parse CSV
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
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

    // 7. Clean and validate rows
    const feedbackRows = records
      .map((row, index) => {
        const text =
          row.text ||
          row.feedback ||
          row.comment ||
          row.content;

        if (!text?.trim()) {
          return null;
        }

        let rating: number | null = null;

        if (row.rating?.trim()) {
          const parsedRating = Number(row.rating);

          if (
            !Number.isInteger(parsedRating) ||
            parsedRating < 1 ||
            parsedRating > 5
          ) {
            return null;
          }

          rating = parsedRating;
        }

        return {
          rowNumber: index + 2,
          text: text.trim(),
          rating,
          customerName:
            row.customerName?.trim() ||
            row.customer_name?.trim() ||
            null,
          customerEmail:
            row.customerEmail?.trim() ||
            row.customer_email?.trim() ||
            null,
        };
      })
      .filter(
        (
          item
        ): item is NonNullable<typeof item> => item !== null
      );

    if (feedbackRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid feedback records found",
        },
        { status: 400 }
      );
    }

    // 8. AI classification
    const classifiedRows = feedbackRows.map((row) => {
      const classification = classifyFeedback(row.text);

      return {
        ...row,
        classification,
      };
    });

    // 9. Save everything in one transaction
    const result = await prisma.$transaction(async (tx) => {
      let imported = 0;

      for (const row of classifiedRows) {
        const feedback = await tx.feedback.create({
          data: {
            workspaceId,
            text: row.text,

            source: FeedbackSource.CSV,
            status: FeedbackStatus.NEW,

            sentiment: row.classification.sentiment,
            sentimentScore:
              row.classification.sentimentScore,
            featureArea:
              row.classification.featureArea,

            rating: row.rating,

            customerName: row.customerName,
            customerEmail: row.customerEmail,
          },
        });

        // Connect detected themes
        for (const themeName of row.classification.themes) {
          const theme = await tx.theme.findFirst({
            where: {
              workspaceId,
              name: themeName,
            },
          });

          if (theme) {
            await tx.feedbackTheme.create({
              data: {
                feedbackId: feedback.id,
                themeId: theme.id,
                confidence: 1,
              },
            });
          }
        }

        imported++;
      }

      return imported;
    });

    // 10. Return result
    return NextResponse.json({
      success: true,
      message: "CSV imported and classified successfully",
      data: {
        imported: result,
        totalRows: records.length,
        skipped: records.length - result,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/feedback/import failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to import CSV",
      },
      { status: 500 }
    );
  }
}
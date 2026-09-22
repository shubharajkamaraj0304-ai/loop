import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  FeedbackSource,
  FeedbackStatus,
  UserRole,
} from "@/app/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { canAnalyze } from "@/app/lib/auth/permissions";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    const page = Math.max(
      Number(searchParams.get("page") || 1),
      1
    );

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 20), 1),
      100
    );

    const skip = (page - 1) * limit;

    const where = {
      workspaceId,
      ...(status
        ? { status: status as FeedbackStatus }
        : {}),
      ...(source
        ? { source: source as FeedbackSource }
        : {}),
      ...(search
        ? {
            OR: [
              {
                text: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                customerName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                customerEmail: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          themes: {
            include: {
              theme: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.feedback.count({
        where,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: feedback,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/feedback failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch feedback",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // ADMIN and ANALYST can create feedback
    if (!canAnalyze(session.user.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to create feedback",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const body = await request.json();

    const {
      text,
      source,
      status,
      sentiment,
      rating,
      customerName,
      customerEmail,
    } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback text is required",
        },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        workspaceId,
        text: text.trim(),
        source: source || "MANUAL",
        status: status || "NEW",
        sentiment: sentiment || null,
        rating:
          rating !== undefined && rating !== null
            ? Number(rating)
            : null,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Feedback created successfully",
        data: feedback,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/feedback failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create feedback",
      },
      { status: 500 }
    );
  }
}
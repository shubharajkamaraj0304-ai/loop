import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  FeedbackSource,
  FeedbackStatus,
  UserRole,
  Prisma,
} from "@/app/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { canAnalyze } from "@/app/lib/auth/permissions";
import { classifyFeedback } from "@/app/lib/ai/classifier";

// GET /api/feedback
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

    const page = Math.max(Number(searchParams.get("page") || "1"), 1);

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || "20"), 1),
      100
    );

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const source = searchParams.get("source")?.trim() || "";
    const channel = searchParams.get("channel")?.trim() || "";
    const sentiment =
      searchParams.get("sentiment")?.trim().toLowerCase() || "";
    const theme = searchParams.get("theme")?.trim() || "";

    // Date filters
    const fromDate = searchParams.get("fromDate")?.trim() || "";
    const toDate = searchParams.get("toDate")?.trim() || "";

    const where: Prisma.FeedbackWhereInput = {
      workspaceId,
    };

    if (search) {
      where.OR = [
        {
          text: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          customerName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          customerEmail: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (
      status &&
      Object.values(FeedbackStatus).includes(status as FeedbackStatus)
    ) {
      where.status = status as FeedbackStatus;
    }

    if (
      source &&
      Object.values(FeedbackSource).includes(source as FeedbackSource)
    ) {
      where.source = source as FeedbackSource;
    }

    if (channel) {
      where.channel = channel;
    }

    if (sentiment) {
      where.sentiment = sentiment;
    }

    // Theme filter
    if (theme) {
      where.themes = {
        some: {
          theme: {
            name: {
              equals: theme,
              mode: "insensitive",
            },
          },
        },
      };
    }

    // Date range filter
    if (fromDate || toDate) {
      const createdAt: Prisma.DateTimeFilter = {};

      if (fromDate) {
        const startDate = new Date(`${fromDate}T00:00:00`);

        if (!Number.isNaN(startDate.getTime())) {
          createdAt.gte = startDate;
        }
      }

      if (toDate) {
        const endDate = new Date(`${toDate}T23:59:59.999`);

        if (!Number.isNaN(endDate.getTime())) {
          createdAt.lte = endDate;
        }
      }

      if (Object.keys(createdAt).length > 0) {
        where.createdAt = createdAt;
      }
    }

    const total = await prisma.feedback.count({
      where,
    });

    const feedback = await prisma.feedback.findMany({
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
      skip: (page - 1) * limit,
      take: limit,
    });

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

// POST /api/feedback
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

    const userRole = session.user.role as UserRole;

    if (!canAnalyze(userRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to add feedback",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const body = await request.json();

    const text =
      typeof body.text === "string"
        ? body.text.trim()
        : typeof body.content === "string"
          ? body.content.trim()
          : "";

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback content is required",
        },
        { status: 400 }
      );
    }

    // Manual feedback requires a channel.
    const channel =
      typeof body.channel === "string" ? body.channel.trim().toUpperCase() : "";

    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          message: "Channel is required",
        },
        { status: 400 }
      );
    }

    const allowedChannels = [
      "MANUAL",
      "WEB",
      "EMAIL",
      "CHAT",
      "SIMULATED",
    ];

    if (!allowedChannels.includes(channel)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid channel. Allowed channels: MANUAL, WEB, EMAIL, CHAT, SIMULATED",
        },
        { status: 400 }
      );
    }

    let rating: number | null = null;

    if (
      body.rating !== undefined &&
      body.rating !== null &&
      body.rating !== ""
    ) {
      const parsedRating = Number(body.rating);

      if (
        !Number.isInteger(parsedRating) ||
        parsedRating < 1 ||
        parsedRating > 5
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Rating must be an integer between 1 and 5",
          },
          { status: 400 }
        );
      }

      rating = parsedRating;
    }

    const classification = classifyFeedback(text);

    const feedback = await prisma.feedback.create({
      data: {
        workspaceId,
        text,
        channel,
        source: FeedbackSource.MANUAL,
        status: FeedbackStatus.NEW,
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        featureArea: classification.featureArea,
        rating,
        customerName:
          typeof body.customerName === "string"
            ? body.customerName.trim() || null
            : null,
        customerEmail:
          typeof body.customerEmail === "string"
            ? body.customerEmail.trim() || null
            : null,
      },
    });

    for (const themeName of classification.themes) {
      const theme = await prisma.theme.findFirst({
        where: {
          workspaceId,
          name: themeName,
        },
      });

      if (theme) {
        await prisma.feedbackTheme.create({
          data: {
            feedbackId: feedback.id,
            themeId: theme.id,
            confidence: 1,
          },
        });
      }
    }

    const feedbackWithThemes = await prisma.feedback.findFirst({
      where: {
        id: feedback.id,
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

    return NextResponse.json(
      {
        success: true,
        message: "Feedback created successfully",
        data: feedbackWithThemes,
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
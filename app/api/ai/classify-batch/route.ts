import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    // Limit batch size to avoid very large AI requests
    if (feedbackIds.length > 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum 10 feedback records can be classified at once",
        },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        id: {
          in: feedbackIds,
        },
        workspaceId,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (feedback.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No feedback records found",
        },
        { status: 404 }
      );
    }

    const themes = await prisma.theme.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (themes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No themes found in this workspace",
        },
        { status: 400 }
      );
    }

    const themeList = themes
      .map(
        (theme) =>
          `${theme.id}: ${theme.name} - ${
            theme.description || "No description"
          }`
      )
      .join("\n");

    const feedbackList = feedback
      .map(
        (item) =>
          `ID: ${item.id}\nFeedback: "${item.text}"`
      )
      .join("\n\n");

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `
You are an AI customer-feedback classifier for the LOOP platform.

Classify every feedback item below.

Available themes:
${themeList}

Feedback items:
${feedbackList}

Return ONLY valid JSON in exactly this format:

[
  {
    "feedbackId": 123,
    "sentiment": "POSITIVE",
    "themeId": 1,
    "reason": "Short explanation"
  }
]

Rules:

- sentiment must be exactly POSITIVE, NEGATIVE, or NEUTRAL.
- themeId must be one of the available theme IDs.
- feedbackId must match one of the supplied feedback IDs.
- Return exactly one result for every supplied feedback item.
- Do not include markdown.
- Do not include any text outside the JSON array.
`,
        },
      ],
    });

    const responseText =
      message.content[0]?.type === "text"
        ? message.content[0].text
        : "";

    let results: Array<{
      feedbackId: number;
      sentiment: string;
      themeId: number;
      reason?: string;
    }>;

    try {
      results = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "AI returned invalid JSON",
          rawResponse: responseText,
        },
        { status: 500 }
      );
    }

    if (!Array.isArray(results)) {
      return NextResponse.json(
        {
          success: false,
          message: "AI returned an invalid result format",
        },
        { status: 500 }
      );
    }

    const validSentiments = [
      "POSITIVE",
      "NEGATIVE",
      "NEUTRAL",
    ];

    const updatedResults = [];

    for (const result of results) {
      if (
        !feedbackIds.includes(Number(result.feedbackId)) ||
        !validSentiments.includes(result.sentiment)
      ) {
        continue;
      }

      const selectedTheme = themes.find(
        (theme) => theme.id === Number(result.themeId)
      );

      if (!selectedTheme) {
        continue;
      }

      const feedbackItem = feedback.find(
        (item) => item.id === Number(result.feedbackId)
      );

      if (!feedbackItem) {
        continue;
      }

      await prisma.feedback.update({
        where: {
          id: feedbackItem.id,
        },
        data: {
          sentiment: result.sentiment,
        },
      });

      await prisma.feedbackTheme.deleteMany({
        where: {
          feedbackId: feedbackItem.id,
        },
      });

      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedbackItem.id,
          themeId: selectedTheme.id,
          confidence: 1,
        },
      });

      updatedResults.push({
        feedbackId: feedbackItem.id,
        sentiment: result.sentiment,
        theme: {
          id: selectedTheme.id,
          name: selectedTheme.name,
        },
        reason: result.reason || null,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Feedback batch classified successfully",
      data: {
        requested: feedback.length,
        classified: updatedResults.length,
        results: updatedResults,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/ai/classify-batch failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to classify feedback batch",
      },
      { status: 500 }
    );
  }
}
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

    // Read request body
    const body = await request.json();

    const { feedbackId } = body;

    if (!feedbackId) {
      return NextResponse.json(
        {
          success: false,
          message: "feedbackId is required",
        },
        { status: 400 }
      );
    }

    // Get feedback only from the user's workspace
    const feedback = await prisma.feedback.findFirst({
      where: {
        id: Number(feedbackId),
        workspaceId,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback not found",
        },
        { status: 404 }
      );
    }

    // Get available themes for this workspace
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

    const themeList = themes
      .map(
        (theme) =>
          `${theme.id}: ${theme.name} - ${theme.description || "No description"}`
      )
      .join("\n");

    // Send feedback to Claude
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `
You are an AI customer-feedback classifier for the LOOP platform.

Analyze the following customer feedback.

Feedback:
"${feedback.text}"

Available themes:
${themeList}

Return ONLY valid JSON in exactly this format:

{
  "sentiment": "POSITIVE",
  "themeId": 1,
  "reason": "Short explanation"
}

Sentiment must be exactly one of:
POSITIVE
NEGATIVE
NEUTRAL

themeId must be one of the available theme IDs.

Do not include markdown or any text outside the JSON.
`,
        },
      ],
    });

    // Get Claude response text
    const responseText =
      message.content[0].type === "text"
        ? message.content[0].text
        : "";

    // Parse JSON
    let result;

    try {
      result = JSON.parse(responseText);
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

    // Validate sentiment
    const validSentiments = ["POSITIVE", "NEGATIVE", "NEUTRAL"];

    if (!validSentiments.includes(result.sentiment)) {
      return NextResponse.json(
        {
          success: false,
          message: "AI returned an invalid sentiment",
        },
        { status: 500 }
      );
    }

    // Check theme exists in this workspace
    const selectedTheme = themes.find(
      (theme) => theme.id === Number(result.themeId)
    );

    if (!selectedTheme) {
      return NextResponse.json(
        {
          success: false,
          message: "AI returned an invalid theme",
        },
        { status: 500 }
      );
    }

    // Update feedback sentiment
    const updatedFeedback = await prisma.feedback.update({
      where: {
        id: feedback.id,
      },
      data: {
        sentiment: result.sentiment,
      },
    });

    // Remove existing theme connections
    await prisma.feedbackTheme.deleteMany({
      where: {
        feedbackId: feedback.id,
      },
    });

    // Create new theme connection
    await prisma.feedbackTheme.create({
      data: {
        feedbackId: feedback.id,
        themeId: selectedTheme.id,
        confidence: 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feedback classified successfully",
      data: {
        feedbackId: updatedFeedback.id,
        sentiment: updatedFeedback.sentiment,
        theme: {
          id: selectedTheme.id,
          name: selectedTheme.name,
        },
        reason: result.reason || null,
      },
    });
  } catch (error) {
    console.error("POST /api/ai/classify failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to classify feedback",
      },
      { status: 500 }
    );
  }
}
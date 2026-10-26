import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/lib/auth/auth-options";
import { searchFeedback } from "@/app/lib/ai/search";

const askSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Question must be at least 3 characters")
    .max(500, "Question is too long"),
});

type SearchResult = Awaited<ReturnType<typeof searchFeedback>>[number];

function buildAnswer(
  question: string,
  results: SearchResult[]
): string {
  if (results.length === 0) {
    return "I could not find relevant feedback for that question in your workspace.";
  }

  const lowerQuestion = question.toLowerCase();

  const negativeResults = results.filter(
    (item) => item.sentiment?.toLowerCase() === "negative"
  );

  const positiveResults = results.filter(
    (item) => item.sentiment?.toLowerCase() === "positive"
  );

  const neutralResults = results.filter(
    (item) => item.sentiment?.toLowerCase() === "neutral"
  );

  const themeCounts = new Map<string, number>();

  for (const item of results) {
    for (const theme of item.themes) {
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
    }
  }

  const topThemes = Array.from(themeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const ratings = results
    .map((item) => item.rating)
    .filter((rating): rating is number => rating !== null);

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) /
        ratings.length
      : null;

  const negativeExamples = negativeResults
    .slice(0, 3)
    .map((item) => item.text)
    .filter(Boolean);

  const positiveExamples = positiveResults
    .slice(0, 3)
    .map((item) => item.text)
    .filter(Boolean);

  const themeSummary =
    topThemes.length > 0
      ? topThemes
          .map(([theme, count]) => `${theme} (${count})`)
          .join(", ")
      : "no specific themes";

  if (
    lowerQuestion.includes("unhappy") ||
    lowerQuestion.includes("complaint") ||
    lowerQuestion.includes("problem") ||
    lowerQuestion.includes("issue") ||
    lowerQuestion.includes("wrong") ||
    lowerQuestion.includes("bad")
  ) {
    if (negativeResults.length === 0) {
      return `I found ${results.length} relevant feedback records, but none of the retrieved records were classified as negative.`;
    }

    let answer =
      `Customers mainly report concerns related to ${themeSummary}. ` +
      `I found ${negativeResults.length} negative records among the ` +
      `${results.length} most relevant results.`;

    if (negativeExamples.length > 0) {
      answer += ` Examples include: ${negativeExamples
        .map((text) => `"${text}"`)
        .join(" ")}`;
    }

    return answer;
  }

  if (
    lowerQuestion.includes("positive") ||
    lowerQuestion.includes("happy") ||
    lowerQuestion.includes("liked") ||
    lowerQuestion.includes("good") ||
    lowerQuestion.includes("praised")
  ) {
    if (positiveResults.length === 0) {
      return `I found ${results.length} relevant feedback records, but none of the retrieved records were classified as positive.`;
    }

    let answer =
      `Customers are positive mainly about ${themeSummary}. ` +
      `I found ${positiveResults.length} positive records among the ` +
      `${results.length} most relevant results.`;

    if (positiveExamples.length > 0) {
      answer += ` Examples include: ${positiveExamples
        .map((text) => `"${text}"`)
        .join(" ")}`;
    }

    return answer;
  }

  if (
    lowerQuestion.includes("rating") ||
    lowerQuestion.includes("score") ||
    lowerQuestion.includes("review")
  ) {
    if (averageRating !== null) {
      return (
        `The average rating among the ${ratings.length} retrieved ` +
        `feedback records with ratings is ${averageRating.toFixed(1)}/5. ` +
        `The main themes are ${themeSummary}.`
      );
    }

    return `I found ${results.length} relevant feedback records, but the retrieved records do not contain ratings.`;
  }

  if (
    lowerQuestion.includes("theme") ||
    lowerQuestion.includes("topic") ||
    lowerQuestion.includes("trend")
  ) {
    if (topThemes.length === 0) {
      return `I found ${results.length} relevant feedback records, but no themes were assigned to them.`;
    }

    return (
      `Among the most relevant feedback, the leading themes are ` +
      `${themeSummary}. ` +
      `${positiveResults.length} records are positive, ` +
      `${negativeResults.length} are negative, and ` +
      `${neutralResults.length} are neutral.`
    );
  }

  let answer =
    `Based on the ${results.length} most relevant feedback records, ` +
    `customers are mainly discussing ${themeSummary}. ` +
    `${positiveResults.length} records are positive, ` +
    `${negativeResults.length} are negative, and ` +
    `${neutralResults.length} are neutral.`;

  if (averageRating !== null) {
    answer += ` The average rating in the retrieved records is ${averageRating.toFixed(1)}/5.`;
  }

  if (negativeExamples.length > 0) {
    answer += ` Common concerns include ${negativeExamples
      .slice(0, 2)
      .map((text) => `"${text}"`)
      .join(" and ")}.`;
  }

  return answer;
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

    const body = await request.json();

    const validation = askSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid question",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { question } = validation.data;
    const workspaceId = session.user.workspaceId;

    const results = await searchFeedback(
      workspaceId,
      question,
      10
    );

    const answer = buildAnswer(question, results);

    return NextResponse.json({
      success: true,
      data: {
        question,
        answer,
        sources: results.map((item) => ({
          feedbackId: item.id,
          text: item.text,
          sentiment: item.sentiment,
          sentimentScore: item.sentimentScore,
          featureArea: item.featureArea,
          rating: item.rating,
          themes: item.themes,
          source: item.source,
          createdAt: item.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("POST /api/ai/ask failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process Ask LOOP question",
      },
      { status: 500 }
    );
  }
}
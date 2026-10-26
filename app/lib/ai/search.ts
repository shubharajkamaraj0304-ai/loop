import { prisma } from "@/app/lib/prisma";

type FeedbackSearchResult = {
  id: number;
  text: string;
  sentiment: string | null;
  sentimentScore: number | null;
  featureArea: string | null;
  rating: number | null;
  source: string;
  status: string;
  createdAt: Date;
  themes: string[];
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((word) => word.length >= 3);
}

function calculateMatchScore(
  queryWords: string[],
  feedback: FeedbackSearchResult
): number {
  const searchableText = normalizeText(
    [
      feedback.text,
      feedback.sentiment ?? "",
      feedback.featureArea ?? "",
      feedback.themes.join(" "),
      feedback.source,
      feedback.status,
    ].join(" ")
  );

  const searchableWords = new Set(tokenize(searchableText));

  let score = 0;

  for (const word of queryWords) {
    if (searchableWords.has(word)) {
      score += 1;
    }
  }

  const normalizedFeedback = normalizeText(feedback.text);
  const normalizedQuery = normalizeText(queryWords.join(" "));

  if (
    normalizedQuery.length >= 5 &&
    normalizedFeedback.includes(normalizedQuery)
  ) {
    score += 3;
  }

  return score;
}

export async function searchFeedback(
  workspaceId: number,
  query: string,
  limit = 10
): Promise<FeedbackSearchResult[]> {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  const queryWords = tokenize(normalizedQuery);

  if (queryWords.length === 0) {
    return [];
  }

  const feedback = await prisma.feedback.findMany({
    where: {
      workspaceId,
    },
    include: {
      themes: {
        include: {
          theme: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 500,
  });

  const results = feedback
    .map((item) => {
      const formatted: FeedbackSearchResult = {
        id: item.id,
        text: item.text,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        featureArea: item.featureArea,
        rating: item.rating,
        source: item.source,
        status: item.status,
        createdAt: item.createdAt,
        themes: item.themes.map(
          (feedbackTheme) => feedbackTheme.theme.name
        ),
      };

      return {
        ...formatted,
        score: calculateMatchScore(queryWords, formatted),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => ({
  id: item.id,
  text: item.text,
  sentiment: item.sentiment,
  sentimentScore: item.sentimentScore,
  featureArea: item.featureArea,
  rating: item.rating,
  source: item.source,
  status: item.status,
  createdAt: item.createdAt,
  themes: item.themes,
}));

  return results;
}
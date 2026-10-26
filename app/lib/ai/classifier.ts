
import { z } from "zod";

const ClassificationSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  sentimentScore: z.number().min(-1).max(1),
  themes: z.array(z.string()).min(1),
  featureArea: z.string().min(1),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

const POSITIVE_WORDS = [
  "good",
  "great",
  "excellent",
  "amazing",
  "love",
  "loved",
  "like",
  "liked",
  "helpful",
  "fast",
  "easy",
  "happy",
  "satisfied",
  "perfect",
  "awesome",
  "smooth",
  "friendly",
  "reliable",
  "quick",
  "excellent",
  "impressive",
  "fantastic",
  "wonderful",
  "convenient",
  "useful",
  "efficient",
  "recommend",
  "recommended",
];

const NEGATIVE_WORDS = [
  "bad",
  "poor",
  "terrible",
  "worst",
  "hate",
  "hated",
  "slow",
  "difficult",
  "problem",
  "issue",
  "broken",
  "bug",
  "error",
  "unhappy",
  "disappointed",
  "disappointing",
  "expensive",
  "late",
  "delay",
  "delayed",
  "failed",
  "failure",
  "confusing",
  "awful",
  "horrible",
  "useless",
  "unreliable",
  "frustrating",
  "frustrated",
  "poorly",
  "damaged",
  "missing",
  "wrong",
  "complaint",
];

const NEGATIVE_PHRASES = [
  "not good",
  "not great",
  "not helpful",
  "not happy",
  "not satisfied",
  "not satisfied with",
  "not reliable",
  "not working",
  "does not work",
  "doesn't work",
  "did not work",
  "didn't work",
  "very slow",
  "too slow",
  "too expensive",
  "poor quality",
  "bad quality",
  "very bad",
  "very poor",
  "very difficult",
  "very confusing",
  "highly disappointed",
  "really disappointed",
  "extremely disappointed",
  "never again",
];

const POSITIVE_PHRASES = [
  "very good",
  "very helpful",
  "very happy",
  "very satisfied",
  "very fast",
  "really good",
  "really helpful",
  "really happy",
  "really satisfied",
  "highly recommend",
  "strongly recommend",
  "excellent quality",
  "great quality",
  "works perfectly",
  "works well",
  "easy to use",
  "very easy",
];

const THEME_KEYWORDS: Record<string, string[]> = {
  "Customer Support": [
    "support",
    "agent",
    "customer service",
    "help",
    "helpful",
    "response",
    "ticket",
    "representative",
    "staff",
    "service",
  ],

  Pricing: [
    "price",
    "pricing",
    "cost",
    "expensive",
    "cheap",
    "discount",
    "payment",
    "subscription",
    "fee",
    "charge",
    "billing",
  ],

  "Product Quality": [
    "quality",
    "broken",
    "defect",
    "damaged",
    "durable",
    "performance",
    "product",
    "reliable",
    "unreliable",
  ],

  Delivery: [
    "delivery",
    "shipping",
    "shipment",
    "package",
    "order",
    "late",
    "delay",
    "delayed",
    "arrived",
    "arrival",
    "courier",
    "dispatch",
  ],

  "User Experience": [
    "website",
    "app",
    "application",
    "interface",
    "ui",
    "navigation",
    "easy",
    "difficult",
    "confusing",
    "login",
    "checkout",
    "usability",
    "experience",
  ],

  Features: [
    "feature",
    "function",
    "option",
    "filter",
    "search",
    "notification",
    "integration",
    "dashboard",
    "functionality",
  ],
};

const FEATURE_KEYWORDS: Record<string, string[]> = {
  "Customer Support": [
    "support",
    "agent",
    "ticket",
    "response",
    "service",
    "representative",
  ],

  Payments: [
    "payment",
    "card",
    "billing",
    "invoice",
    "transaction",
    "charge",
    "refund",
  ],

  Delivery: [
    "delivery",
    "shipping",
    "shipment",
    "order",
    "package",
    "courier",
  ],

  "Product Quality": [
    "product",
    "quality",
    "defect",
    "broken",
    "damaged",
    "performance",
    "reliable",
  ],

  "User Experience": [
    "website",
    "app",
    "application",
    "interface",
    "navigation",
    "checkout",
    "login",
    "usability",
  ],

  Features: [
    "feature",
    "function",
    "option",
    "filter",
    "search",
    "notification",
    "integration",
    "dashboard",
  ],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsKeyword(text: string, keyword: string): boolean {
  const escapedKeyword = keyword
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const pattern = new RegExp(`\\b${escapedKeyword}\\b`, "i");

  return pattern.test(text);
}

function countMatches(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => {
    return count + (containsKeyword(text, keyword) ? 1 : 0);
  }, 0);
}

function countPhraseMatches(text: string, phrases: string[]): number {
  return phrases.reduce((count, phrase) => {
    return count + (containsKeyword(text, phrase) ? 1 : 0);
  }, 0);
}

function calculateSentiment(text: string) {
  const normalized = normalizeText(text);

  let positiveScore = 0;
  let negativeScore = 0;

  // Phrase-level sentiment gets higher weight.
  positiveScore +=
    countPhraseMatches(normalized, POSITIVE_PHRASES) * 2;

  negativeScore +=
    countPhraseMatches(normalized, NEGATIVE_PHRASES) * 2;

  // Handle explicit negation before counting individual words.
  const positiveWordsAfterNegation = POSITIVE_WORDS.filter((word) =>
    containsKeyword(normalized, `not ${word}`)
  );

  const negativeWordsAfterNegation = NEGATIVE_WORDS.filter((word) =>
    containsKeyword(normalized, `not ${word}`)
  );

  // Count individual positive words, excluding negated positives.
  const positiveCount = countMatches(
    normalized,
    POSITIVE_WORDS
  );

  const negativeCount = countMatches(
    normalized,
    NEGATIVE_WORDS
  );

  positiveScore +=
    positiveCount - positiveWordsAfterNegation.length;

  negativeScore +=
    negativeCount - negativeWordsAfterNegation.length;

  // Negated positive words become negative.
  negativeScore += positiveWordsAfterNegation.length;

  // Negated negative words become positive.
  positiveScore += negativeWordsAfterNegation.length;

  // Prevent a phrase such as "not helpful" from being counted
  // twice as both phrase-negative and word-positive.
  for (const phrase of NEGATIVE_PHRASES) {
    if (containsKeyword(normalized, phrase)) {
      const words = phrase.split(" ");

      for (const word of words) {
        if (POSITIVE_WORDS.includes(word)) {
          positiveScore = Math.max(0, positiveScore - 1);
        }
      }
    }
  }

  const totalScore = positiveScore + negativeScore;

  if (totalScore === 0) {
    return {
      sentiment: "neutral" as const,
      sentimentScore: 0,
    };
  }

  const score =
    (positiveScore - negativeScore) / totalScore;

  const roundedScore = Number(score.toFixed(2));

  if (score >= 0.2) {
    return {
      sentiment: "positive" as const,
      sentimentScore: roundedScore,
    };
  }

  if (score <= -0.2) {
    return {
      sentiment: "negative" as const,
      sentimentScore: roundedScore,
    };
  }

  return {
    sentiment: "neutral" as const,
    sentimentScore: roundedScore,
  };
}

function detectThemes(text: string): string[] {
  const normalized = normalizeText(text);

  const matches = Object.entries(THEME_KEYWORDS)
    .map(([theme, keywords]) => ({
      theme,
      matches: countMatches(normalized, keywords),
    }))
    .filter((item) => item.matches > 0)
    .sort((a, b) => {
      if (b.matches !== a.matches) {
        return b.matches - a.matches;
      }

      return a.theme.localeCompare(b.theme);
    });

  if (matches.length === 0) {
    return ["General"];
  }

  return matches.slice(0, 3).map((item) => item.theme);
}

function detectFeatureArea(text: string): string {
  const normalized = normalizeText(text);

  const matches = Object.entries(FEATURE_KEYWORDS)
    .map(([feature, keywords]) => ({
      feature,
      matches: countMatches(normalized, keywords),
    }))
    .filter((item) => item.matches > 0)
    .sort((a, b) => {
      if (b.matches !== a.matches) {
        return b.matches - a.matches;
      }

      return a.feature.localeCompare(b.feature);
    });

  if (matches.length === 0) {
    return "General";
  }

  return matches[0].feature;
}

export function classifyFeedback(
  text: string
): ClassificationResult {
  const sentimentResult = calculateSentiment(text);

  const result = {
    sentiment: sentimentResult.sentiment,
    sentimentScore: sentimentResult.sentimentScore,
    themes: detectThemes(text),
    featureArea: detectFeatureArea(text),
  };

  return ClassificationSchema.parse(result);
}


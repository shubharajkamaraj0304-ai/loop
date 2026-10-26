"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

type Analytics = {
  themes?: {
    id: number;
    name: string;
    description: string | null;
    feedbackCount: number;
  }[];

  status?: {
    status: string;
    count: number;
  }[];

  source?: {
    source: string;
    count: number;
  }[];
};

type ThemeAnalytics = {
  id: number;
  name: string;
  description: string | null;
  currentCount: number;
  previousCount: number;
  percentageOfFeedback: number;
  percentageChange: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  spike: boolean;
  trend: "up" | "down" | "stable";
};

type ThemeAnalyticsResponse = {
  success: boolean;
  period?: {
    days: number;
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
  };
  summary?: {
    totalThemes: number;
    totalFeedback: number;
    themesWithFeedback: number;
    spikes: number;
  };
  data?: ThemeAnalytics[];
  message?: string;
};

type ThemeFeedbackItem = {
  id: number;
  text: string;
  channel: string;
  source: string;
  status: string;
  sentiment: string | null;
  sentimentScore: number | null;
  featureArea: string | null;
  rating: number | null;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string;
  confidence: number | null;
};

type ThemeFeedbackResponse = {
  success: boolean;
  data?: {
    theme: {
      id: number;
      name: string;
      description: string | null;
    };
    feedback: ThemeFeedbackItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ratingDistribution, setRatingDistribution] = useState<
    { rating: number; count: number }[]
  >([]);

  const [sentimentData, setSentimentData] = useState<
    { sentiment: string; count: number }[]
  >([]);

  const [themeTrends, setThemeTrends] = useState<
    {
      date: string;
      theme: string;
      count: number;
    }[]
  >([]);

  const [themeAnalytics, setThemeAnalytics] = useState<ThemeAnalytics[]>(
    []
  );

  const [themeAnalyticsSummary, setThemeAnalyticsSummary] = useState<{
    totalThemes: number;
    totalFeedback: number;
    themesWithFeedback: number;
    spikes: number;
  } | null>(null);

  const [themeAnalyticsLoading, setThemeAnalyticsLoading] = useState(false);

  const [themeAnalyticsError, setThemeAnalyticsError] = useState("");

  const [themePeriod, setThemePeriod] = useState(30);

  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(
    null
  );

  const [selectedThemeName, setSelectedThemeName] = useState("");

  const [themeFeedback, setThemeFeedback] = useState<ThemeFeedbackItem[]>(
    []
  );

  const [themeFeedbackLoading, setThemeFeedbackLoading] = useState(false);

  const [themeFeedbackError, setThemeFeedbackError] = useState("");

  const [themeFeedbackPage, setThemeFeedbackPage] = useState(1);

  const [themeFeedbackTotalPages, setThemeFeedbackTotalPages] = useState(1);

  const [themeFeedbackTotal, setThemeFeedbackTotal] = useState(0);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/analytics");
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to load analytics.");
        return;
      }

      console.log("Analytics API response:", result.data);

      setAnalytics(result.data);

      const ratingsResponse = await fetch(
        "/api/analytics/ratings/distribution"
      );

      const ratingsResult = await ratingsResponse.json();

      if (ratingsResponse.ok && ratingsResult.success) {
        setRatingDistribution(ratingsResult.data);
      }

      const sentimentResponse = await fetch("/api/analytics/sentiment");

      const sentimentResult = await sentimentResponse.json();

      if (sentimentResponse.ok && sentimentResult.success) {
        setSentimentData(sentimentResult.data);
      }

      const trendsResponse = await fetch(
        "/api/analytics/themes/trends"
      );

      const trendsResult = await trendsResponse.json();

      if (trendsResponse.ok && trendsResult.success) {
        setThemeTrends(trendsResult.data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function loadThemeAnalytics(period: number) {
    try {
      setThemeAnalyticsLoading(true);
      setThemeAnalyticsError("");

      const response = await fetch(
        `/api/analytics/themes?period=${period}`
      );

      const result: ThemeAnalyticsResponse = await response.json();

      if (!response.ok || !result.success) {
        setThemeAnalyticsError(
          result.message || "Failed to load theme analytics."
        );
        return;
      }

      setThemeAnalytics(result.data ?? []);

      setThemeAnalyticsSummary(result.summary ?? null);
    } catch (error) {
      console.error("Failed to load AI2 theme analytics:", error);

      setThemeAnalyticsError("Unable to load theme trend analytics.");
    } finally {
      setThemeAnalyticsLoading(false);
    }
  }

  async function loadThemeFeedback(
    themeId: number,
    page: number = 1
  ) {
    try {
      setThemeFeedbackLoading(true);
      setThemeFeedbackError("");

      const response = await fetch(
        `/api/analytics/themes/${themeId}?page=${page}&limit=10`
      );

      const result: ThemeFeedbackResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setThemeFeedbackError(
          result.message || "Failed to load theme feedback."
        );
        return;
      }

      setThemeFeedback(result.data.feedback);

      setThemeFeedbackPage(result.data.pagination.page);

      setThemeFeedbackTotalPages(result.data.pagination.totalPages);

      setThemeFeedbackTotal(result.data.pagination.total);

      setSelectedThemeName(result.data.theme.name);
    } catch (error) {
      console.error("Failed to load theme feedback:", error);

      setThemeFeedbackError("Unable to load theme feedback.");
    } finally {
      setThemeFeedbackLoading(false);
    }
  }

  function openThemeFeedback(theme: ThemeAnalytics) {
    setSelectedThemeId(theme.id);
    setSelectedThemeName(theme.name);
    setThemeFeedback([]);
    setThemeFeedbackPage(1);
    setThemeFeedbackTotalPages(1);
    setThemeFeedbackTotal(0);

    loadThemeFeedback(theme.id, 1);
  }

  function closeThemeFeedback() {
    setSelectedThemeId(null);
    setThemeFeedback([]);
    setThemeFeedbackError("");
    setThemeFeedbackPage(1);
    setThemeFeedbackTotalPages(1);
    setThemeFeedbackTotal(0);
  }

  function formatLabel(value: string | null | undefined) {
    if (!value) return "Unknown";

    return value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getSentimentClasses(sentiment: string | null) {
    const value = sentiment?.toLowerCase();

    if (value === "positive") {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (value === "negative") {
      return "bg-red-100 text-red-700 border-red-200";
    }

    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadThemeAnalytics(themePeriod);
  }, [themePeriod]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl rounded-xl border bg-white p-10 text-center">
          Loading analytics...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/feedback"
            className="mb-5 inline-block text-sm text-blue-600 hover:underline"
          >
            ← Back to Feedback
          </Link>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl rounded-xl border bg-white p-10 text-center">
          No analytics data available.
        </div>
      </main>
    );
  }

  const statusData = analytics.status ?? [];
  const sourceData = analytics.source ?? [];
  const themesData = analytics.themes ?? [];

  const getStatusCount = (status: string) => {
    return (
      statusData.find((item) => item.status === status)?.count ?? 0
    );
  };

  const totalFeedback = statusData.reduce(
    (total, item) => total + item.count,
    0
  );

  const newCount = getStatusCount("NEW");
  const reviewedCount = getStatusCount("REVIEWED");
  const resolvedCount = getStatusCount("RESOLVED");
  const archivedCount = getStatusCount("ARCHIVED");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics
          </h1>

          <p className="mt-1 text-gray-500">
            Understand customer feedback patterns and trends.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Feedback
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalFeedback}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Themes
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {themesData.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Feedback Sources
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {sourceData.length}
            </p>
          </div>
        </div>

        {/* AI Theme Intelligence */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                AI Theme Intelligence
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Analyze theme volume, sentiment, trends, and changes
                between periods.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="theme-period"
                className="text-sm font-medium text-gray-600"
              >
                Period
              </label>

              <select
                id="theme-period"
                value={themePeriod}
                onChange={(event) =>
                  setThemePeriod(Number(event.target.value))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>

          {/* AI2 Summary */}
          {!themeAnalyticsLoading &&
            !themeAnalyticsError &&
            themeAnalytics.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-purple-50 p-5">
                  <p className="text-sm text-gray-500">
                    Total Themes
                  </p>

                  <p className="mt-2 text-2xl font-bold text-purple-700">
                    {themeAnalyticsSummary?.totalThemes ??
                      themeAnalytics.length}
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-5">
                  <p className="text-sm text-gray-500">
                    Themes With Feedback
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {themeAnalyticsSummary?.themesWithFeedback ??
                      themeAnalytics.filter(
                        (theme) => theme.currentCount > 0
                      ).length}
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 p-5">
                  <p className="text-sm text-gray-500">
                    Spikes
                  </p>

                  <p className="mt-2 text-2xl font-bold text-orange-700">
                    {themeAnalyticsSummary?.spikes ??
                      themeAnalytics.filter(
                        (theme) => theme.spike
                      ).length}
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 p-5">
                  <p className="text-sm text-gray-500">
                    Feedback In Period
                  </p>

                  <p className="mt-2 text-2xl font-bold text-green-700">
                    {themeAnalyticsSummary?.totalFeedback ?? 0}
                  </p>
                </div>
              </div>
            )}

          {themeAnalyticsLoading && (
            <div className="mt-6 rounded-lg bg-gray-50 p-8 text-center text-gray-500">
              Loading theme intelligence...
            </div>
          )}

          {!themeAnalyticsLoading && themeAnalyticsError && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
              {themeAnalyticsError}
            </div>
          )}

          {!themeAnalyticsLoading &&
            !themeAnalyticsError &&
            themeAnalytics.length === 0 && (
              <div className="mt-6 rounded-lg bg-gray-50 p-8 text-center text-gray-500">
                No theme analytics available for this period.
              </div>
            )}

          {/* AI2 Theme Cards */}
          {!themeAnalyticsLoading &&
            !themeAnalyticsError &&
            themeAnalytics.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {themeAnalytics.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => openThemeFeedback(theme)}
                    className="rounded-xl border bg-gray-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {theme.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {theme.description ||
                            "No description available."}
                        </p>
                      </div>

                      {theme.spike ? (
                        <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Spike
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                          Normal
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-500">
                          Feedback
                        </p>

                        <p className="mt-1 text-3xl font-bold text-gray-900">
                          {theme.currentCount}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Share
                        </p>

                        <p className="mt-1 text-lg font-semibold text-purple-700">
                          {theme.percentageOfFeedback}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <span className="text-sm text-gray-500">
                        Previous period
                      </span>

                      <span className="text-sm font-semibold text-gray-700">
                        {theme.previousCount}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Change
                      </span>

                      <span
                        className={`text-sm font-semibold ${
                          theme.percentageChange > 0
                            ? "text-green-600"
                            : theme.percentageChange < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {theme.percentageChange > 0 ? "+" : ""}
                        {theme.percentageChange}%
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Trend
                      </span>

                      <span
                        className={`text-sm font-semibold ${
                          theme.trend === "up"
                            ? "text-green-600"
                            : theme.trend === "down"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {theme.trend === "up"
                          ? "↑ Up"
                          : theme.trend === "down"
                            ? "↓ Down"
                            : "→ Stable"}
                      </span>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Sentiment
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-green-50 p-2 text-center">
                          <p className="text-xs text-gray-500">
                            Positive
                          </p>

                          <p className="mt-1 font-bold text-green-700">
                            {theme.sentiment.positive}
                          </p>
                        </div>

                        <div className="rounded-lg bg-red-50 p-2 text-center">
                          <p className="text-xs text-gray-500">
                            Negative
                          </p>

                          <p className="mt-1 font-bold text-red-700">
                            {theme.sentiment.negative}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-100 p-2 text-center">
                          <p className="text-xs text-gray-500">
                            Neutral
                          </p>

                          <p className="mt-1 font-bold text-gray-700">
                            {theme.sentiment.neutral}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-center text-xs font-medium text-blue-600">
                      Click to view feedback →
                    </div>
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Ratings Distribution */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Ratings Distribution
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Number of feedback items for each rating.
          </p>

          <div className="mt-6 h-80">
            {ratingDistribution.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                No rating data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="rating"
                    label={{
                      value: "Rating",
                      position: "insideBottom",
                      offset: -5,
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    label={{
                      value: "Feedback Count",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />

                  <Tooltip />

                  <Bar dataKey="count" name="Feedback" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Theme Trends */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Theme Trends
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Track how customer themes change over time.
          </p>

          <div className="mt-6 h-96">
            {themeTrends.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                No theme trend data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={themeTrends}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="date" />

                  <YAxis
                    allowDecimals={false}
                    label={{
                      value: "Feedback Count",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Feedback"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feedback Status */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Feedback Status
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-5">
              <p className="text-sm text-gray-500">New</p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {newCount}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-5">
              <p className="text-sm text-gray-500">Reviewed</p>

              <p className="mt-2 text-2xl font-bold text-yellow-600">
                {reviewedCount}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-5">
              <p className="text-sm text-gray-500">Resolved</p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {resolvedCount}
              </p>
            </div>

            <div className="rounded-lg bg-gray-100 p-5">
              <p className="text-sm text-gray-500">Archived</p>

              <p className="mt-2 text-2xl font-bold text-gray-600">
                {archivedCount}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Themes */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Feedback Themes
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themesData.map((theme) => (
              <div
                key={theme.id}
                className="rounded-lg border bg-gray-50 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">
                    {theme.name}
                  </h3>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                    {theme.feedbackCount}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  {theme.description ||
                    "No description available."}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Sentiment
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Distribution of customer feedback by sentiment.
          </p>

          <div className="mt-6 h-80">
            {sentimentData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                No sentiment data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="sentiment" />

                  <YAxis
                    allowDecimals={false}
                    label={{
                      value: "Feedback Count",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />

                  <Tooltip />

                  <Bar dataKey="count" name="Feedback" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feedback by Theme */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Feedback by Theme
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Number of customer feedback items associated with each
            theme.
          </p>

          <div className="mt-6 h-96">
            {themesData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                No theme data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={themesData}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 20,
                    left: 20,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="feedbackCount"
                    name="Feedback"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sources */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Feedback Sources
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {sourceData.map((item) => (
              <div
                key={item.source}
                className="rounded-lg bg-gray-50 p-5"
              >
                <p className="text-sm text-gray-500">
                  {formatLabel(item.source)}
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {item.count}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/feedback"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            View Feedback
          </Link>

          <Link
            href="/feedback/stats"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Feedback Statistics
          </Link>

          <Link
            href="/feedback/import"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Import CSV
          </Link>
        </div>
      </div>

      {/* Theme Feedback Drill-Down Modal */}
      {selectedThemeId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeThemeFeedback}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedThemeName}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {themeFeedbackTotal} feedback items associated
                  with this theme.
                </p>
              </div>

              <button
                type="button"
                onClick={closeThemeFeedback}
                aria-label="Close"
                className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-6">
              {themeFeedbackLoading && (
                <div className="rounded-xl bg-gray-50 p-10 text-center text-gray-500">
                  Loading theme feedback...
                </div>
              )}

              {!themeFeedbackLoading && themeFeedbackError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                  {themeFeedbackError}
                </div>
              )}

              {!themeFeedbackLoading &&
                !themeFeedbackError &&
                themeFeedback.length > 0 && (
                  <div className="space-y-4">
                    {themeFeedback.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border bg-white p-5 shadow-sm"
                      >
                        {/* Feedback Text */}
                        <p className="text-sm leading-6 text-gray-900">
                          {item.text}
                        </p>

                        {/* Metadata */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-lg border bg-gray-50 p-3">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                              Sentiment
                            </p>

                            <span
                              className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSentimentClasses(
                                item.sentiment
                              )}`}
                            >
                              {formatLabel(item.sentiment)}
                            </span>
                          </div>

                          <div className="rounded-lg border bg-gray-50 p-3">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                              Channel
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-800">
                              {formatLabel(item.channel)}
                            </p>
                          </div>

                          <div className="rounded-lg border bg-gray-50 p-3">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                              Source
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-800">
                              {formatLabel(item.source)}
                            </p>
                          </div>

                          <div className="rounded-lg border bg-gray-50 p-3">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                              Status
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-800">
                              {formatLabel(item.status)}
                            </p>
                          </div>

                          {item.rating !== null && (
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                Rating
                              </p>

                              <p className="mt-1 text-sm font-semibold text-gray-800">
                                {item.rating}/5
                              </p>
                            </div>
                          )}

                          {item.featureArea && (
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                Feature Area
                              </p>

                              <p className="mt-1 text-sm font-semibold text-gray-800">
                                {item.featureArea}
                              </p>
                            </div>
                          )}

                          {item.customerEmail && (
                            <div className="rounded-lg border bg-gray-50 p-3">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                Customer Email
                              </p>

                              <p className="mt-1 break-all text-sm font-medium text-gray-700">
                                {item.customerEmail}
                              </p>
                            </div>
                          )}

                          <div className="rounded-lg border bg-gray-50 p-3">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                              Confidence
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-800">
                              {item.confidence !== null
                                ? `${Math.round(
                                    item.confidence * 100
                                  )}%`
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Customer + Date */}
                        <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            {item.customerName ? (
                              <p className="text-sm font-semibold text-gray-800">
                                {item.customerName}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400">
                                Anonymous customer
                              </p>
                            )}
                          </div>

                          <p className="text-xs text-gray-500">
                            {new Date(
                              item.createdAt
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {!themeFeedbackLoading &&
                !themeFeedbackError &&
                themeFeedback.length === 0 && (
                  <div className="rounded-xl bg-gray-50 p-10 text-center text-gray-500">
                    No feedback found for this theme.
                  </div>
                )}

              {/* Pagination */}
              {!themeFeedbackLoading &&
                !themeFeedbackError &&
                themeFeedbackTotalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t pt-5">
                    <button
                      type="button"
                      disabled={themeFeedbackPage <= 1}
                      onClick={() => {
                        if (
                          selectedThemeId !== null &&
                          themeFeedbackPage > 1
                        ) {
                          loadThemeFeedback(
                            selectedThemeId,
                            themeFeedbackPage - 1
                          );
                        }
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ← Previous
                    </button>

                    <span className="text-sm font-medium text-gray-600">
                      Page {themeFeedbackPage} of{" "}
                      {themeFeedbackTotalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        themeFeedbackPage >=
                        themeFeedbackTotalPages
                      }
                      onClick={() => {
                        if (
                          selectedThemeId !== null &&
                          themeFeedbackPage <
                            themeFeedbackTotalPages
                        ) {
                          loadThemeFeedback(
                            selectedThemeId,
                            themeFeedbackPage + 1
                          );
                        }
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next →
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
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
const sentimentResponse = await fetch(
  "/api/analytics/sentiment"
);

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

  useEffect(() => {
    loadAnalytics();
  }, []);

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

          <Bar
            dataKey="count"
            name="Feedback"
          />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
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
              <p className="text-sm text-gray-500">
                New
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {newCount}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-5">
              <p className="text-sm text-gray-500">
                Reviewed
              </p>

              <p className="mt-2 text-2xl font-bold text-yellow-600">
                {reviewedCount}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-5">
              <p className="text-sm text-gray-500">
                Resolved
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {resolvedCount}
              </p>
            </div>

            <div className="rounded-lg bg-gray-100 p-5">
              <p className="text-sm text-gray-500">
                Archived
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-600">
                {archivedCount}
              </p>
            </div>

          </div>
        </div>

        {/* Themes */}
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
                  {theme.description || "No description available."}
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

          <Bar
            dataKey="count"
            name="Feedback"
          />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
</div>
{/* Theme Feedback Count */}
<div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold text-gray-900">
    Feedback by Theme
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Number of customer feedback items associated with each theme.
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
                  {item.source}
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
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  totalFeedback: number;
  status: {
    new: number;
    reviewed: number;
    resolved: number;
    archived: number;
  };
  averageRating: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/dashboard", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        console.log("DASHBOARD API RESPONSE:", result);

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load dashboard"
          );
        }

        setData(result.data);
      } catch (error) {
        console.error("Dashboard error:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">
            LOOP Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">
            LOOP Dashboard
          </h1>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="font-medium text-red-700">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">
            LOOP Dashboard
          </h1>

          <p className="mt-4 text-gray-500">
            No dashboard data available.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            LOOP Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Customer Feedback Intelligence Platform
          </p>
        </div>

        {/* Overview */}
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Feedback Statistics
        </h2>

        <p className="mb-5 text-sm text-gray-500">
          Overview of customer feedback and its current status.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">

          {/* Total */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Feedback
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.totalFeedback}
            </p>
          </div>

          {/* New */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              New
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.status.new}
            </p>
          </div>

          {/* Reviewed */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Reviewed
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.status.reviewed}
            </p>
          </div>

          {/* Resolved */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.status.resolved}
            </p>
          </div>

          {/* Archived */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Archived
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.status.archived}
            </p>
          </div>

        </div>

        {/* Analytics */}
        <h2 className="mb-4 mt-10 text-xl font-semibold text-gray-900">
          Analytics
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* Average Rating */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Average Rating
            </p>

            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">
                {data.averageRating.toFixed(1)}
              </p>

              <span className="text-sm text-gray-500">
                / 5
              </span>
            </div>
          </div>

          {/* Positive */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Positive
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.sentiment.positive}
            </p>
          </div>

          {/* Negative */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Negative
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.sentiment.negative}
            </p>
          </div>

          {/* Neutral */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Neutral
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.sentiment.neutral}
            </p>
          </div>

        </div>

        {/* Quick Actions */}
        <h2 className="mb-4 mt-10 text-xl font-semibold text-gray-900">
          Feedback Management
        </h2>

        <div className="grid gap-4 md:grid-cols-3">

          <a
            href="/feedback"
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">
              View Feedback
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Browse and manage customer feedback.
            </p>
          </a>

          <a
            href="/feedback/add"
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">
              Add Feedback
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add new customer feedback manually.
            </p>
          </a>

          <a
            href="/feedback/import"
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">
              Import CSV
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Import multiple feedback records.
            </p>
          </a>

        </div>

      </div>
    </main>
  );
}
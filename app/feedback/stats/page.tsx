"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  totalFeedback: number;
  status: {
    new: number;
    reviewed: number;
    resolved: number;
    archived: number;
  };
  averageRating: number;
};

export default function FeedbackStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/feedback/stats");
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to load feedback statistics.");
        return;
      }

      console.log("Feedback Stats API response:", result.data);

      setStats(result.data);
    } catch (error) {
      console.error("Failed to load feedback statistics:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl rounded-xl border bg-white p-10 text-center">
          Loading statistics...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
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

  if (!stats) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl rounded-xl border bg-white p-10 text-center">
          No statistics available.
        </div>
      </main>
    );
  }

  const total = stats.totalFeedback ?? 0;

  const newCount = stats.status?.new ?? 0;
  const reviewed = stats.status?.reviewed ?? 0;
  const resolved = stats.status?.resolved ?? 0;
  const archived = stats.status?.archived ?? 0;

  const averageRating =
    typeof stats.averageRating === "number"
      ? stats.averageRating.toFixed(1)
      : "N/A";

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        <Link
          href="/feedback"
          className="mb-5 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Back to Feedback
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Feedback Statistics
          </h1>

          <p className="mt-1 text-gray-500">
            Overview of customer feedback and its current status.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Feedback
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {total}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              New
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {newCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Reviewed
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {reviewed}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {resolved}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Archived
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-600">
              {archived}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Average Rating
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {averageRating}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Out of 5
            </p>
          </div>

        </div>

        {/* Status Overview */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Status Overview
          </h2>

          <div className="mt-6 space-y-5">

            {/* New */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  New
                </span>

                <span className="text-gray-500">
                  {newCount} feedback
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${total ? (newCount / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Reviewed */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Reviewed
                </span>

                <span className="text-gray-500">
                  {reviewed} feedback
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{
                    width: `${total ? (reviewed / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Resolved */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Resolved
                </span>

                <span className="text-gray-500">
                  {resolved} feedback
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{
                    width: `${total ? (resolved / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Archived */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Archived
                </span>

                <span className="text-gray-500">
                  {archived} feedback
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-400"
                  style={{
                    width: `${total ? (archived / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

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
            href="/feedback/add"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Add Feedback
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
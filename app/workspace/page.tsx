"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Workspace = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  counts: {
    users: number;
    feedback: number;
    themes: number;
    reports: number;
  };
};

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWorkspace() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/workspace");
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to load workspace.");
        return;
      }

      console.log("Workspace API response:", result.data);

      setWorkspace(result.data);
    } catch (error) {
      console.error("Failed to load workspace:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl rounded-xl border bg-white p-10 text-center">
          Loading workspace...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl rounded-xl border bg-white p-10 text-center">
          No workspace found.
        </div>
      </main>
    );
  }

  const createdDate = new Date(workspace.createdAt).toLocaleDateString();
  const updatedDate = new Date(workspace.updatedAt).toLocaleDateString();

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Workspace
          </h1>

          <p className="mt-1 text-gray-500">
            Manage and view your LOOP workspace information.
          </p>
        </div>

        {/* Workspace Information */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Workspace Information
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">

            <div>
              <p className="text-sm text-gray-500">
                Workspace Name
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900">
                {workspace.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Workspace Slug
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900">
                {workspace.slug}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Workspace ID
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900">
                {workspace.id}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Created
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900">
                {createdDate}
              </p>
            </div>

          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8">

          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Workspace Statistics
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Users
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {workspace.counts.users}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Feedback
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-600">
                {workspace.counts.feedback}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Themes
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {workspace.counts.themes}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Reports
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-600">
                {workspace.counts.reports}
              </p>
            </div>

          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Last Updated
          </p>

          <p className="mt-1 font-medium text-gray-900">
            {updatedDate}
          </p>

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
            href="/analytics"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Analytics
          </Link>

        </div>

      </div>
    </main>
  );
}
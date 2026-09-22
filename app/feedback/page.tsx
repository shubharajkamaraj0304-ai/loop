"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Feedback = {
  id: number;
  text: string;
  source: string;
  status: string;
  sentiment: string | null;
  rating: number | null;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string;
  themes: {
    theme: {
      id: number;
      name: string;
    };
  }[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function loadFeedback(
    currentPage = page,
    currentSearch = search,
    currentStatus = status,
    currentSource = source
  ) {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      query.set("page", String(currentPage));
      query.set("limit", "10");

      if (currentSearch.trim()) {
        query.set("search", currentSearch.trim());
      }

      if (currentStatus) {
        query.set("status", currentStatus);
      }

      if (currentSource) {
        query.set("source", currentSource);
      }

      const url = "/api/feedback?" + query.toString();

      console.log("Loading:", url);

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setFeedback(result.data);
        setPagination(result.pagination);
      } else {
        setFeedback([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Failed to load feedback:", error);
      setFeedback([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback(page, search, status, source);
  }, [page, status, source]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    loadFeedback(1, search, status, source);
  }

  function handleClearFilters() {
    setSearch("");
    setStatus("");
    setSource("");
    setPage(1);

    loadFeedback(1, "", "", "");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Feedback
            </h1>

            <p className="mt-1 text-gray-500">
              View and manage customer feedback.
            </p>
          </div>

          <Link
            href="/feedback/add"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            + Add Feedback
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">

          <div className="grid gap-4 md:grid-cols-4">

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="md:col-span-2"
            >
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search
              </label>

              <div className="flex gap-2">

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search feedback..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
                />

                <button
                  type="submit"
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-white hover:bg-gray-800"
                >
                  Search
                </button>

              </div>
            </form>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) => {
                  const value = event.target.value;

                  setStatus(value);
                  setPage(1);

                  loadFeedback(1, search, value, source);
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              >
                <option value="">All Status</option>
                <option value="NEW">New</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="RESOLVED">Resolved</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Source
              </label>

              <select
                value={source}
                onChange={(event) => {
                  const value = event.target.value;

                  setSource(value);
                  setPage(1);

                  loadFeedback(1, search, status, value);
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              >
                <option value="">All Sources</option>
                <option value="MANUAL">Manual</option>
                <option value="CSV">CSV</option>
                <option value="API">API</option>
                <option value="IMPORT">Import</option>
              </select>
            </div>

          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>

        </div>

        {/* Total */}
        {pagination && (
          <div className="mb-4 text-sm text-gray-500">
            Total feedback: {pagination.total}
          </div>
        )}

        {/* Feedback list */}
        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            Loading feedback...
          </div>
        ) : feedback.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            No feedback found.
          </div>
        ) : (
          <div className="space-y-4">

            {feedback.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >

                <div className="flex flex-col justify-between gap-3 md:flex-row">

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {item.customerName || "Anonymous Customer"}
                    </h2>

                    {item.customerEmail && (
                      <p className="text-sm text-gray-500">
                        {item.customerEmail}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                      {item.source}
                    </span>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                      {item.status}
                    </span>

                    {item.sentiment && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
                        {item.sentiment}
                      </span>
                    )}

                  </div>

                </div>

                {/* Feedback text */}
                <p className="mt-4 leading-7 text-gray-700">
                  {item.text}
                </p>

                {/* Information */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">

                  <span>
                    Rating: {item.rating ?? "N/A"}
                  </span>

                  <span>
                    Date:{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>

                </div>

                {/* Themes */}
                {item.themes.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">

                    {item.themes.map((relation) => (
                      <span
                        key={relation.theme.id}
                        className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700"
                      >
                        {relation.theme.name}
                      </span>
                    ))}

                  </div>
                )}

                {/* View Details */}
                <div className="mt-5 border-t pt-4">

                  <Link
                    href={`/feedback/${item.id}`}
                    className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    View Details →
                  </Link>

                </div>

              </div>
            ))}

          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">

            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40"
            >
              ← Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40"
            >
              Next →
            </button>

          </div>
        )}

      </div>
    </main>
  );
}

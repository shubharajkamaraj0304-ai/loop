"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "next-auth/react";

type Feedback = {
  id: number;
  text: string;
  source: string;
  channel: string;
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
  const [channel, setChannel] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [theme, setTheme] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [userRole, setUserRole] = useState("");

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");

  const [simulating, setSimulating] = useState(false);
  const [simulateMessage, setSimulateMessage] = useState("");
  const [simulateError, setSimulateError] = useState("");

  const canManage =
    userRole === "ADMIN" || userRole === "ANALYST";

  async function loadSession() {
    try {
      const session = await getSession();

      setUserRole(session?.user?.role || "");
    } catch (error) {
      console.error("Failed to load session:", error);
      setUserRole("");
    }
  }

  async function loadFeedback(
    currentPage = page,
    currentSearch = search,
    currentStatus = status,
    currentSource = source,
    currentChannel = channel,
    currentSentiment = sentiment,
    currentTheme = theme,
    currentFromDate = fromDate,
    currentToDate = toDate
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

      if (currentChannel) {
        query.set("channel", currentChannel);
      }

      if (currentSentiment) {
        query.set("sentiment", currentSentiment);
      }

      if (currentTheme) {
        query.set("theme", currentTheme);
      }

      if (currentFromDate) {
        query.set("fromDate", currentFromDate);
      }

      if (currentToDate) {
        query.set("toDate", currentToDate);
      }

      const response = await fetch(
        `/api/feedback?${query.toString()}`
      );

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
    loadSession();

    loadFeedback(
      page,
      search,
      status,
      source,
      channel,
      sentiment,
      theme,
      fromDate,
      toDate
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    status,
    source,
    channel,
    sentiment,
    theme,
    fromDate,
    toDate,
  ]);

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);

    loadFeedback(
      1,
      search,
      status,
      source,
      channel,
      sentiment,
      theme,
      fromDate,
      toDate
    );
  }

  function handleClearFilters() {
    setSearch("");
    setStatus("");
    setSource("");
    setChannel("");
    setSentiment("");
    setTheme("");
    setFromDate("");
    setToDate("");
    setPage(1);

    loadFeedback(1, "", "", "", "", "", "", "", "");
  }

  function handleCsvChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;

    setCsvFile(file);
    setImportMessage("");
    setImportError("");

    if (
      file &&
      !file.name.toLowerCase().endsWith(".csv")
    ) {
      setImportError("Please select a CSV file.");
      setCsvFile(null);
    }
  }

  async function handleCsvImport() {
    if (!canManage) {
      setImportError(
        "You do not have permission to import feedback."
      );
      return;
    }

    if (!csvFile) {
      setImportError("Please select a CSV file first.");
      return;
    }

    try {
      setImporting(true);
      setImportMessage("");
      setImportError("");

      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await fetch(
        "/api/feedback/import",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setImportError(
          result.message || "Failed to import CSV."
        );
        return;
      }

      setImportMessage(
        `${result.message}. Imported ${result.data.imported} of ${result.data.totalRows} rows.`
      );

      setCsvFile(null);

      const fileInput = document.getElementById(
        "csv-file"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setPage(1);

      await loadFeedback(
        1,
        search,
        status,
        source,
        channel,
        sentiment,
        theme,
        fromDate,
        toDate
      );
    } catch (error) {
      console.error("CSV import failed:", error);

      setImportError(
        "Something went wrong while importing the CSV."
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleSimulateChannel() {
    if (!canManage) {
      setSimulateError(
        "You do not have permission to simulate a channel."
      );
      return;
    }

    try {
      setSimulating(true);
      setSimulateMessage("");
      setSimulateError("");

      const response = await fetch(
        "/api/feedback/simulate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            count: 5,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setSimulateError(
          result.message ||
            "Failed to import simulated feedback."
        );
        return;
      }

      setSimulateMessage(
        `${result.message}. Imported ${result.data.imported} simulated feedback records.`
      );

      setPage(1);

      await loadFeedback(
        1,
        search,
        status,
        source,
        channel,
        sentiment,
        theme,
        fromDate,
        toDate
      );
    } catch (error) {
      console.error(
        "Simulated channel import failed:",
        error
      );

      setSimulateError(
        "Something went wrong while importing simulated feedback."
      );
    } finally {
      setSimulating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Feedback
            </h1>

            <p className="mt-1 text-gray-500">
              {canManage
                ? "View and manage customer feedback."
                : "View customer feedback."}
            </p>
          </div>

          {canManage && (
            <Link
              href="/feedback/add"
              className="rounded-lg bg-blue-600 px-5 py-3 text-center font-medium text-white hover:bg-blue-700"
            >
              + Add Feedback
            </Link>
          )}
        </div>

        {canManage && (
          <>
            <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Simulated Channel
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Simulate feedback arriving from an
                    external channel integration.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateChannel}
                  disabled={simulating}
                  className="rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {simulating
                    ? "Importing..."
                    : "Simulate Channel"}
                </button>
              </div>

              {simulateMessage && (
                <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                  {simulateMessage}
                </div>
              )}

              {simulateError && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {simulateError}
                </div>
              )}
            </div>

            <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Import Feedback from CSV
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Upload a CSV file to import and
                  automatically classify customer feedback.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="csv-file"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    CSV File
                  </label>

                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCsvImport}
                  disabled={!csvFile || importing}
                  className="rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing
                    ? "Importing..."
                    : "Import CSV"}
                </button>
              </div>

              {csvFile && !importError && (
                <p className="mt-3 text-sm text-gray-600">
                  Selected:{" "}
                  <span className="font-medium">
                    {csvFile.name}
                  </span>
                </p>
              )}

              {importMessage && (
                <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                  {importMessage}
                </div>
              )}

              {importError && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {importError}
                </div>
              )}
            </div>
          </>
        )}

        <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
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
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
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

                  loadFeedback(
                    1,
                    search,
                    value,
                    source,
                    channel,
                    sentiment,
                    theme,
                    fromDate,
                    toDate
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              >
                <option value="">All Status</option>
                <option value="NEW">New</option>
                <option value="REVIEWED">
                  Reviewed
                </option>
                <option value="RESOLVED">
                  Resolved
                </option>
                <option value="ARCHIVED">
                  Archived
                </option>
              </select>
            </div>

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

                  loadFeedback(
                    1,
                    search,
                    status,
                    value,
                    channel,
                    sentiment,
                    theme,
                    fromDate,
                    toDate
                  );
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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Channel
              </label>

              <select
                value={channel}
                onChange={(event) => {
                  const value = event.target.value;

                  setChannel(value);
                  setPage(1);

                  loadFeedback(
                    1,
                    search,
                    status,
                    source,
                    value,
                    sentiment,
                    theme,
                    fromDate,
                    toDate
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              >
                <option value="">All Channels</option>
                <option value="MANUAL">Manual</option>
                <option value="WEB">Web</option>
                <option value="EMAIL">Email</option>
                <option value="CHAT">Chat</option>
                <option value="SIMULATED">
                  Simulated
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sentiment
              </label>

              <select
                value={sentiment}
                onChange={(event) => {
                  const value = event.target.value;

                  setSentiment(value);
                  setPage(1);

                  loadFeedback(
                    1,
                    search,
                    status,
                    source,
                    channel,
                    value,
                    theme,
                    fromDate,
                    toDate
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              >
                <option value="">
                  All Sentiments
                </option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Theme
              </label>

              <select
                value={theme}
                onChange={(event) => {
                  const value = event.target.value;

                  setTheme(value);
                  setPage(1);

                  loadFeedback(
                    1,
                    search,
                    status,
                    source,
                    channel,
                    sentiment,
                    value,
                    fromDate,
                    toDate
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              >
                <option value="">All Themes</option>
                <option value="Customer Support">
                  Customer Support
                </option>
                <option value="Delivery">Delivery</option>
                <option value="Features">Features</option>
                <option value="Pricing">Pricing</option>
                <option value="Product Quality">
                  Product Quality
                </option>
                <option value="User Experience">
                  User Experience
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="from-date"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                From Date
              </label>

              <input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(event) => {
                  const value = event.target.value;

                  setFromDate(value);
                  setPage(1);

                  loadFeedback(
                    1,
                    search,
                    status,
                    source,
                    channel,
                    sentiment,
                    theme,
                    value,
                    toDate
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              />
            </div>

            <div>
              <label
                htmlFor="to-date"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                To Date
              </label>

              <input
                id="to-date"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => {
                  const value = event.target.value;

                  setToDate(value);
                  setPage(1);

                  loadFeedback(
                    1,
                    search,
                    status,
                    source,
                    channel,
                    sentiment,
                    theme,
                    fromDate,
                    value
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              />
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

        {pagination && (
          <div className="mb-4 text-sm text-gray-500">
            Total feedback: {pagination.total}
          </div>
        )}

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
                      {item.customerName ||
                        "Anonymous Customer"}
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

                    {item.channel && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
                        {item.channel}
                      </span>
                    )}

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

                <p className="mt-4 leading-7 text-gray-700">
                  {item.text}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>
                    Rating: {item.rating ?? "N/A"}
                  </span>

                  <span>
                    Date:{" "}
                    {new Date(
                      item.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>

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
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= pagination.totalPages
              }
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
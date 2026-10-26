"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import jsPDF from "jspdf";

type Report = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type ParsedReport = {
  period?: number;
  periodStart?: string;
  periodEnd?: string;
  totalFeedback?: number;
  sentiment?: {
    positive: number;
    negative: number;
    neutral: number;
    positivePercentage?: number;
    negativePercentage?: number;
    neutralPercentage?: number;
  };
  topThemes?: {
    name: string;
    count: number;
    percentage?: number;
  }[];
  representativeQuotes?: string[];
  positiveQuotes?: string[];
  actions?: string[];
};

function parseReportContent(content: string): ParsedReport | null {
  try {
    const parsed = JSON.parse(content);

    if (parsed && typeof parsed === "object") {
      return parsed as ParsedReport;
    }

    return null;
  } catch {
    return null;
  }
}

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString();
}

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) {
    return "Not available";
  }

  if (start && end) {
    return `${formatDate(start)} – ${formatDate(end)}`;
  }

  return formatDate(start || end);
}

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const reportId = params.id;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [userRole, setUserRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);

  const canManage =
    userRole === "ADMIN" || userRole === "ANALYST";

  const loadSession = useCallback(async () => {
    try {
      setRoleLoading(true);

      const session = await getSession();

      setUserRole(session?.user?.role || "");
    } catch (err) {
      console.error("Failed to load session:", err);
      setUserRole("");
    } finally {
      setRoleLoading(false);
    }
  }, []);

  const loadReport = useCallback(async () => {
    if (!reportId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/reports/${reportId}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load report");
      }

      setReport(data.data);
      setTitle(data.data.title);
      setContent(data.data.content);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load report."
      );
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId, loadReport]);

  async function saveReport() {
    if (!reportId) {
      return;
    }

    if (!canManage) {
      setError("You do not have permission to edit reports.");
      return;
    }

    if (!title.trim()) {
      setError("Report title is required.");
      return;
    }

    if (!content.trim()) {
      setError("Report content is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update report"
        );
      }

      setReport(data.data);
      setTitle(data.data.title);
      setContent(data.data.content);
      setEditing(false);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update report."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteReport() {
    if (!reportId) {
      return;
    }

    if (!canManage) {
      setError("You do not have permission to delete reports.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete report"
        );
      }

      router.push("/reports");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete report."
      );
    } finally {
      setSaving(false);
    }
  }

  function downloadPDF() {
    if (!report) {
      return;
    }

    const parsed = parseReportContent(report.content);

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    let y = 20;

    function ensureSpace(requiredHeight: number) {
      if (y + requiredHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    }

    function addTitle(textValue: string) {
      ensureSpace(16);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);

      const lines = doc.splitTextToSize(
        textValue,
        contentWidth
      );

      doc.text(lines, margin, y);

      y += lines.length * 8 + 5;
    }

    function addSectionTitle(textValue: string) {
      ensureSpace(14);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);

      doc.text(textValue, margin, y);

      y += 8;
    }

    function addBody(textValue: string) {
      if (!textValue) {
        return;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const lines = doc.splitTextToSize(
        textValue,
        contentWidth
      );

      ensureSpace(lines.length * 5 + 5);

      doc.text(lines, margin, y);

      y += lines.length * 5 + 5;
    }

    function addBullet(textValue: string) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const bulletWidth = contentWidth - 8;

      const lines = doc.splitTextToSize(
        textValue,
        bulletWidth
      );

      ensureSpace(lines.length * 5 + 5);

      doc.text("•", margin, y);
      doc.text(lines, margin + 5, y);

      y += lines.length * 5 + 5;
    }

    addTitle(report.title);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    addBody(`Created: ${formatDate(report.createdAt)}`);

    if (parsed) {
      addBody(
        `Period: ${parsed.period ?? "Not available"} days`
      );

      addBody(
        `Analysis: ${formatDateRange(
          parsed.periodStart,
          parsed.periodEnd
        )}`
      );

      if (parsed.totalFeedback !== undefined) {
        addBody(
          `Total Feedback: ${parsed.totalFeedback}`
        );
      }

      y += 3;

      if (parsed.sentiment) {
        addSectionTitle("Sentiment Overview");

        addBullet(
          `Positive: ${parsed.sentiment.positive} (${parsed.sentiment.positivePercentage ?? 0}%)`
        );

        addBullet(
          `Negative: ${parsed.sentiment.negative} (${parsed.sentiment.negativePercentage ?? 0}%)`
        );

        addBullet(
          `Neutral: ${parsed.sentiment.neutral} (${parsed.sentiment.neutralPercentage ?? 0}%)`
        );

        y += 3;
      }

      if (
        parsed.topThemes &&
        parsed.topThemes.length > 0
      ) {
        addSectionTitle("Top Customer Themes");

        parsed.topThemes.forEach((theme) => {
          addBullet(
            `${theme.name}: ${theme.count} ${
              theme.percentage !== undefined
                ? `(${theme.percentage}%)`
                : ""
            }`
          );
        });

        y += 3;
      }

      if (
        parsed.representativeQuotes &&
        parsed.representativeQuotes.length > 0
      ) {
        addSectionTitle("Customer Pain Points");

        parsed.representativeQuotes.forEach(
          (quote) => {
            addBullet(`"${quote}"`);
          }
        );

        y += 3;
      }

      if (
        parsed.positiveQuotes &&
        parsed.positiveQuotes.length > 0
      ) {
        addSectionTitle("Positive Customer Feedback");

        parsed.positiveQuotes.forEach((quote) => {
          addBullet(`"${quote}"`);
        });

        y += 3;
      }

      if (
        parsed.actions &&
        parsed.actions.length > 0
      ) {
        addSectionTitle("Recommended Actions");

        parsed.actions.forEach((action) => {
          addBullet(action);
        });
      }
    } else {
      addSectionTitle("Report Content");
      addBody(report.content);
    }

    ensureSpace(15);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);

    doc.text(
      "LOOP · Voice of Customer Intelligence",
      margin,
      pageHeight - 10
    );

    doc.save(
      `${report.title
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()}.pdf`
    );
  }

  if (loading || roleLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-10 text-center">
          Loading report...
        </div>
      </main>
    );
  }

  if (error && !report) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => router.push("/reports")}
            className="mb-5 text-sm text-blue-600 hover:underline"
          >
            ← Back to Reports
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl rounded-xl border bg-white p-10 text-center">
          Report not found.
        </div>
      </main>
    );
  }

  const parsedReport = parseReportContent(report.content);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/reports")}
          className="mb-5 text-sm text-blue-600 hover:underline"
        >
          ← Back to Reports
        </button>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Voice of Customer Report
            </span>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              {editing ? "Edit Report" : report.title}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Created {formatDate(report.createdAt)}
            </p>
          </div>

          {!editing && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadPDF}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Download PDF
              </button>

              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setEditing(true);
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={deleteReport}
                    disabled={saving}
                    className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {editing ? (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <label
                htmlFor="report-title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Report Title
              </label>

              <input
                id="report-title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="report-content"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Report Content
              </label>

              <textarea
                id="report-content"
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                rows={16}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveReport}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitle(report.title);
                  setContent(report.content);
                  setError("");
                  setEditing(false);
                }}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {parsedReport ? (
              <div className="space-y-6">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Report #
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {report.id}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Period
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {parsedReport.period ?? "—"} days
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Total Feedback
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {parsedReport.totalFeedback ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t pt-5">
                    <p className="text-sm text-gray-500">
                      Analysis Period
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatDateRange(
                        parsedReport.periodStart,
                        parsedReport.periodEnd
                      )}
                    </p>
                  </div>
                </div>

                {parsedReport.sentiment && (
                  <section className="rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Executive Summary
                    </h2>

                    <p className="mt-2 text-gray-600">
                      This report summarizes customer feedback
                      collected during the selected analysis period.
                      A total of{" "}
                      <strong>
                        {parsedReport.totalFeedback ?? 0}
                      </strong>{" "}
                      feedback records were analyzed.
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="text-sm text-green-700">
                          Positive
                        </p>

                        <p className="mt-1 text-2xl font-bold text-green-800">
                          {parsedReport.sentiment.positive}
                        </p>

                        <p className="mt-1 text-xs text-green-700">
                          {parsedReport.sentiment
                            .positivePercentage ?? 0}
                          %
                        </p>
                      </div>

                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm text-red-700">
                          Negative
                        </p>

                        <p className="mt-1 text-2xl font-bold text-red-800">
                          {parsedReport.sentiment.negative}
                        </p>

                        <p className="mt-1 text-xs text-red-700">
                          {parsedReport.sentiment
                            .negativePercentage ?? 0}
                          %
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-600">
                          Neutral
                        </p>

                        <p className="mt-1 text-2xl font-bold text-gray-800">
                          {parsedReport.sentiment.neutral}
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                          {parsedReport.sentiment
                            .neutralPercentage ?? 0}
                          %
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {parsedReport.sentiment && (
                  <section className="rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Sentiment Overview
                    </h2>

                    <div className="mt-5 space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Positive
                          </span>

                          <span className="text-gray-500">
                            {parsedReport.sentiment.positive}
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{
                              width: `${Math.min(
                                parsedReport.sentiment
                                  .positivePercentage ?? 0,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Negative
                          </span>

                          <span className="text-gray-500">
                            {parsedReport.sentiment.negative}
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{
                              width: `${Math.min(
                                parsedReport.sentiment
                                  .negativePercentage ?? 0,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Neutral
                          </span>

                          <span className="text-gray-500">
                            {parsedReport.sentiment.neutral}
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gray-400"
                            style={{
                              width: `${Math.min(
                                parsedReport.sentiment
                                  .neutralPercentage ?? 0,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {parsedReport.topThemes &&
                  parsedReport.topThemes.length > 0 && (
                    <section className="rounded-xl border bg-white p-6 shadow-sm">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Top Customer Themes
                      </h2>

                      <div className="mt-5 space-y-3">
                        {parsedReport.topThemes.map(
                          (theme, index) => (
                            <div
                              key={`${theme.name}-${index}`}
                              className="flex items-center justify-between rounded-lg border bg-gray-50 p-4"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {theme.name}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {theme.percentage ?? 0}% of
                                  feedback
                                </p>
                              </div>

                              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                                {theme.count}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )}

                {parsedReport.representativeQuotes &&
                  parsedReport.representativeQuotes.length >
                    0 && (
                    <section className="rounded-xl border bg-white p-6 shadow-sm">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Customer Pain Points
                      </h2>

                      <div className="mt-5 space-y-3">
                        {parsedReport.representativeQuotes.map(
                          (quote, index) => (
                            <div
                              key={index}
                              className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4"
                            >
                              <p className="text-sm leading-6 text-gray-700">
                                “{quote}”
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )}

                {parsedReport.positiveQuotes &&
                  parsedReport.positiveQuotes.length > 0 && (
                    <section className="rounded-xl border bg-white p-6 shadow-sm">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Positive Customer Feedback
                      </h2>

                      <div className="mt-5 space-y-3">
                        {parsedReport.positiveQuotes.map(
                          (quote, index) => (
                            <div
                              key={index}
                              className="rounded-lg border-l-4 border-green-400 bg-green-50 p-4"
                            >
                              <p className="text-sm leading-6 text-gray-700">
                                “{quote}”
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )}

                {parsedReport.actions &&
                  parsedReport.actions.length > 0 && (
                    <section className="rounded-xl border bg-white p-6 shadow-sm">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Recommended Actions
                      </h2>

                      <div className="mt-5 space-y-3">
                        {parsedReport.actions.map(
                          (action, index) => (
                            <div
                              key={index}
                              className="flex gap-3 rounded-lg border bg-gray-50 p-4"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                {index + 1}
                              </span>

                              <p className="text-sm leading-6 text-gray-700">
                                {action}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )}

                <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
                  LOOP · Voice of Customer Intelligence
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Report Content
                </h2>

                <p className="whitespace-pre-wrap leading-7 text-gray-700">
                  {report.content}
                </p>

                <div className="mt-8 border-t pt-5 text-center text-sm text-gray-400">
                  LOOP · Voice of Customer Intelligence
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
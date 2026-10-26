"use client";

import { FormEvent, useState } from "react";

type Quote = {
  feedbackId: number;
  text: string;
  sentiment: string | null;
  rating: number | null;
};

type Theme = {
  name: string;
  count: number;
  percentage: number;
};

type ReportData = {
  reportId: number;
  title: string;
  period: number;
  periodStart: string;
  periodEnd: string;
  totalFeedback: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
  };
  topThemes: Theme[];
  representativeQuotes: Quote[];
  positiveQuotes: Quote[];
  actions: string[];
};

type ReportResponse = {
  success: boolean;
  data?: ReportData;
  message?: string;
};

export default function AIReportPage() {
  const [period, setPeriod] = useState("30");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/ai/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period: Number(period),
        }),
      });

      const result: ReportResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message ?? "Failed to generate report."
        );
      }

      setReport(result.data);
    } catch (err) {
      console.error("AI report generation failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Voice of Customer Report
              </h1>

              <p className="mt-2 text-slate-600">
                Generate an AI-powered summary of customer feedback,
                sentiment, themes, quotes, and recommended actions.
              </p>
            </div>

            {report && (
              <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                Report #{report.reportId} generated
              </div>
            )}
          </div>
        </div>

        {/* Generate Report */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Generate Report
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the period you want LOOP to analyze.
            </p>
          </div>

          <form
            onSubmit={handleGenerate}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="period"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Reporting period
              </label>

              <select
                id="period"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 180 days</option>
                <option value="365">Last 365 days</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </form>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        {/* Report */}
        {report && (
          <div className="space-y-6">
            {/* Report Header */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {report.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {formatDate(report.periodStart)} –{" "}
                    {formatDate(report.periodEnd)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {report.totalFeedback}
                  </div>

                  <div className="text-xs font-medium text-slate-500">
                    Feedback records
                  </div>
                </div>
              </div>
            </section>

            {/* Sentiment */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Sentiment Overview
              </h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <p className="text-sm font-semibold text-green-700">
                    Positive
                  </p>

                  <p className="mt-2 text-3xl font-bold text-green-800">
                    {report.sentiment.positive}
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    {report.sentiment.positivePercentage}%
                  </p>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <p className="text-sm font-semibold text-red-700">
                    Negative
                  </p>

                  <p className="mt-2 text-3xl font-bold text-red-800">
                    {report.sentiment.negative}
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {report.sentiment.negativePercentage}%
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Neutral
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-800">
                    {report.sentiment.neutral}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {report.sentiment.neutralPercentage}%
                  </p>
                </div>
              </div>
            </section>

            {/* Themes */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Top Customer Themes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Most frequently occurring themes during the selected period.
              </p>

              <div className="mt-5 space-y-4">
                {report.topThemes.map((theme, index) => (
                  <div
                    key={theme.name}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {index + 1}
                        </span>

                        <span className="font-semibold text-slate-800">
                          {theme.name}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {theme.count}
                        </div>

                        <div className="text-xs text-slate-500">
                          {theme.percentage}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-800"
                        style={{
                          width: `${Math.min(
                            theme.percentage * 4,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Negative Quotes */}
            <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Customer Pain Points
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Representative negative feedback from the selected period.
                </p>
              </div>

              {report.representativeQuotes.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No negative feedback was found for this period.
                </p>
              ) : (
                <div className="space-y-4">
                  {report.representativeQuotes.map((quote) => (
                    <div
                      key={quote.feedbackId}
                      className="rounded-xl border border-red-100 bg-red-50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                          Feedback #{quote.feedbackId}
                        </span>

                        <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                          Negative
                        </span>

                        {quote.rating !== null && (
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                            Rating: {quote.rating}/5
                          </span>
                        )}
                      </div>

                      <p className="mt-3 leading-6 text-slate-800">
                        “{quote.text}”
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Positive Quotes */}
            <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Positive Customer Feedback
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Representative positive feedback from the selected period.
                </p>
              </div>

              {report.positiveQuotes.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No positive feedback was found for this period.
                </p>
              ) : (
                <div className="space-y-4">
                  {report.positiveQuotes.map((quote) => (
                    <div
                      key={quote.feedbackId}
                      className="rounded-xl border border-green-100 bg-green-50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                          Feedback #{quote.feedbackId}
                        </span>

                        <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          Positive
                        </span>

                        {quote.rating !== null && (
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                            Rating: {quote.rating}/5
                          </span>
                        )}
                      </div>

                      <p className="mt-3 leading-6 text-slate-800">
                        “{quote.text}”
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recommended Actions */}
            <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Recommended Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Suggested actions based on the feedback patterns.
                </p>
              </div>

              <div className="space-y-3">
                {report.actions.map((action, index) => (
                  <div
                    key={`${action}-${index}`}
                    className="flex gap-3 rounded-xl bg-blue-50 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-6 text-slate-700">
                      {action}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Empty State */}
        {!report && !loading && !error && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-800">
              No report generated yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Select a reporting period above and click Generate Report
              to create your Voice of Customer analysis.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
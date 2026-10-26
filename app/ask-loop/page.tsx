"use client";

import { FormEvent, useState } from "react";

type Source = {
  feedbackId: number;
  text: string;
  sentiment: string | null;
  sentimentScore: number | null;
  featureArea: string | null;
  rating: number | null;
  themes: string[];
  source: string;
  createdAt: string;
};

type AskResponse = {
  success: boolean;
  data?: {
    question: string;
    answer: string;
    sources: Source[];
  };
  message?: string;
};

export default function AskLoopPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      });

      const result: AskResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message ?? "Failed to get an answer."
        );
      }

      setAnswer(result.data.answer);
      setSources(result.data.sources);
    } catch (err) {
      console.error("Ask LOOP failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Ask LOOP
          </h1>

          <p className="mt-2 text-slate-600">
            Ask questions about your customer feedback and get
            answers grounded in your workspace data.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Customer Feedback Intelligence
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              LOOP searches your feedback and returns the most
              relevant records.
            </p>
          </div>

          <div className="p-6">
            {answer && (
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-2 text-sm font-semibold text-blue-700">
                  LOOP
                </div>

                <p className="leading-7 text-slate-800">
                  {answer}
                </p>
              </div>
            )}

            {sources.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Relevant Feedback
                  </h3>

                  <span className="text-sm text-slate-500">
                    {sources.length} sources
                  </span>
                </div>

                <div className="space-y-3">
                  {sources.map((source) => (
                    <div
                      key={source.feedbackId}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                          Feedback #{source.feedbackId}
                        </span>

                        {source.sentiment && (
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                            {source.sentiment}
                          </span>
                        )}

                        {source.rating !== null && (
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                            Rating: {source.rating}/5
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {source.text}
                      </p>

                      {source.themes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {source.themes.map((theme) => (
                            <span
                              key={theme}
                              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleAsk}>
              <label
                htmlFor="question"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Ask a question
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="question"
                  type="text"
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  placeholder="What are customers saying about delivery?"
                  maxLength={500}
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Thinking..." : "Ask LOOP"}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Maximum 500 characters.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
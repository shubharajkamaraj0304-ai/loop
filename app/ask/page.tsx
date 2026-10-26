"use client";

import { useState } from "react";

type Source = {
  id: number;
  text: string;
  sentiment: string | null;
  rating: number | null;
  channel: string;
  createdAt: string;
};

type AskResponse = {
  success: boolean;
  question?: string;
  answer?: string;
  sources?: Source[];
  message?: string;
};

export default function AskLoopPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askLoop() {
    if (!question.trim()) {
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
          question: question.trim(),
        }),
      });

      const data: AskResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to get an answer.");
      }

      setAnswer(data.answer || "");
      setSources(data.sources || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askLoop();
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
            LOOP Intelligence
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Ask LOOP
          </h1>

          <p className="mt-2 text-slate-600">
            Ask questions about your customer feedback and get AI-powered,
            evidence-based answers.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label
            htmlFor="question"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Ask a question
          </label>

          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Example: What are customers saying about delivery?"
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Press Enter to ask. Use Shift + Enter for a new line.
            </p>

            <button
              type="button"
              onClick={askLoop}
              disabled={loading || !question.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Ask LOOP"}
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {answer && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              LOOP Answer
            </h2>

            <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
              {answer}
            </p>
          </section>
        )}

        {sources.length > 0 && (
          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Supporting Feedback
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Feedback records used to generate the answer.
              </p>
            </div>

            <div className="space-y-4">
              {sources.map((source) => (
                <article
                  key={source.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      Feedback #{source.id}
                    </span>

                    {source.sentiment && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {source.sentiment}
                      </span>
                    )}

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {source.channel}
                    </span>

                    {source.rating !== null && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Rating: {source.rating}/5
                      </span>
                    )}
                  </div>

                  <p className="leading-7 text-slate-700">
                    {source.text}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(source.createdAt).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
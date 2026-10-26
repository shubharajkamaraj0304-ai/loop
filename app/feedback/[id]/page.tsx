"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "next-auth/react";

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
  updatedAt: string;
  themes: {
    theme: {
      id: number;
      name: string;
    };
  }[];
};

export default function FeedbackDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [text, setText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [rating, setRating] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [status, setStatus] = useState("");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userRole, setUserRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canEdit =
    userRole === "ADMIN" || userRole === "ANALYST";

  const loadSession = useCallback(async () => {
    try {
      setRoleLoading(true);

      const session = await getSession();

      setUserRole(session?.user?.role || "");
    } catch (error) {
      console.error("Failed to load session:", error);
      setUserRole("");
    } finally {
      setRoleLoading(false);
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/feedback/${id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to load feedback.");
        return;
      }

      const data: Feedback = result.data;

      setFeedback(data);

      setText(data.text);
      setCustomerName(data.customerName || "");
      setCustomerEmail(data.customerEmail || "");
      setRating(data.rating !== null ? String(data.rating) : "");
      setSentiment(data.sentiment || "");
      setStatus(data.status);
    } catch (error) {
      console.error("Failed to load feedback:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    loadSession();
    loadFeedback();
  }, [id, loadSession, loadFeedback]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      setError("You do not have permission to edit feedback.");
      return;
    }

    setError("");
    setMessage("");

    if (!text.trim()) {
      setError("Feedback text is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          customerName: customerName.trim() || null,
          customerEmail: customerEmail.trim() || null,
          rating: rating ? Number(rating) : null,
          sentiment: sentiment || null,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to update feedback.");
        return;
      }

      setFeedback(result.data);
      setMessage("Feedback updated successfully.");
      setEditing(false);

      await loadFeedback();
    } catch (error) {
      console.error("Failed to update feedback:", error);
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canEdit) {
      setError("You do not have permission to delete feedback.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this feedback?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");
      setSaving(true);

      const response = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to delete feedback.");
        return;
      }

      router.push("/feedback");
    } catch (error) {
      console.error("Failed to delete feedback:", error);
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!feedback) {
      return;
    }

    setText(feedback.text);
    setCustomerName(feedback.customerName || "");
    setCustomerEmail(feedback.customerEmail || "");
    setRating(feedback.rating !== null ? String(feedback.rating) : "");
    setSentiment(feedback.sentiment || "");
    setStatus(feedback.status);

    setError("");
    setMessage("");
    setEditing(false);
  }

  if (loading || roleLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl border bg-white p-10 text-center">
          Loading feedback...
        </div>
      </main>
    );
  }

  if (error && !feedback) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => router.push("/feedback")}
            className="mb-5 text-sm text-blue-600 hover:underline"
          >
            ← Back to Feedback
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!feedback) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl border bg-white p-10 text-center">
          Feedback not found.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/feedback")}
          className="mb-5 text-sm text-blue-600 hover:underline"
        >
          ← Back to Feedback
        </button>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Feedback Details
            </h1>

            <p className="mt-1 text-gray-500">
              {canEdit
                ? "View and edit customer feedback."
                : "View customer feedback."}
            </p>
          </div>

          {!editing && canEdit && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setError("");
                  setEditing(true);
                }}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {editing ? (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <form onSubmit={handleSave}>
              <div className="mb-5">
                <label
                  htmlFor="feedback"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Feedback *
                </label>

                <textarea
                  id="feedback"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="customerName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Customer Name
                </label>

                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="customerEmail"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Customer Email
                </label>

                <input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(event) =>
                    setCustomerEmail(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="rating"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Rating
                </label>

                <select
                  id="rating"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="">No rating</option>
                  <option value="1">1 - Very Poor</option>
                  <option value="2">2 - Poor</option>
                  <option value="3">3 - Average</option>
                  <option value="4">4 - Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="sentiment"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Sentiment
                </label>

                <select
                  id="sentiment"
                  value={sentiment}
                  onChange={(event) =>
                    setSentiment(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="">No sentiment</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="NEGATIVE">Negative</option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="NEW">New</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {feedback.customerName || "Anonymous Customer"}
                </h2>

                {feedback.customerEmail && (
                  <p className="mt-1 text-sm text-gray-500">
                    {feedback.customerEmail}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                  {feedback.source}
                </span>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                  {feedback.status}
                </span>

                {feedback.sentiment && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
                    {feedback.sentiment}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Feedback
              </h3>

              <p className="leading-7 text-gray-700">
                {feedback.text}
              </p>
            </div>

            <div className="mt-6 grid gap-4 border-t pt-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Rating</p>

                <p className="mt-1 font-medium text-gray-900">
                  {feedback.rating ?? "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Source</p>

                <p className="mt-1 font-medium text-gray-900">
                  {feedback.source}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Created</p>

                <p className="mt-1 font-medium text-gray-900">
                  {new Date(feedback.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Last Updated</p>

                <p className="mt-1 font-medium text-gray-900">
                  {new Date(feedback.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {feedback.themes.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Themes
                </h3>

                <div className="flex flex-wrap gap-2">
                  {feedback.themes.map((relation) => (
                    <span
                      key={relation.theme.id}
                      className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700"
                    >
                      {relation.theme.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
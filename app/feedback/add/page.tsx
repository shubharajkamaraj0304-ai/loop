"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddFeedbackPage() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [rating, setRating] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [channel, setChannel] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!text.trim()) {
      setError("Feedback text is required.");
      return;
    }

    if (!channel) {
      setError("Channel is required.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        text: text.trim(),
        customerName: customerName.trim() || null,
        customerEmail: customerEmail.trim() || null,
        rating: rating ? Number(rating) : null,
        sentiment: sentiment || null,
        channel,
        source: "MANUAL",
        status: "NEW",
      };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to create feedback.");
        return;
      }

      setMessage("Feedback created successfully!");

      setText("");
      setCustomerName("");
      setCustomerEmail("");
      setRating("");
      setSentiment("");
      setChannel("");

      setTimeout(() => {
        router.push("/feedback");
      }, 1000);
    } catch (error) {
      console.error("POST /api/feedback error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/feedback")}
            className="mb-4 text-sm text-blue-600 hover:underline"
          >
            ← Back to Feedback
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Add Feedback
          </h1>

          <p className="mt-1 text-gray-500">
            Add a new customer feedback record.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit}>
            {/* Feedback */}
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
                placeholder="Enter customer feedback..."
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Customer Name */}
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
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Customer Email */}
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
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Channel */}
            <div className="mb-5">
              <label
                htmlFor="channel"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Channel *
              </label>

              <select
                id="channel"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select channel</option>
<option value="MANUAL">Manual</option>
<option value="WEB">Website</option>
<option value="EMAIL">Email</option>
<option value="CHAT">Chat</option>
<option value="SIMULATED">Simulated</option>
              </select>
            </div>

            {/* Rating */}
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select rating</option>
                <option value="1">1 - Very Poor</option>
                <option value="2">2 - Poor</option>
                <option value="3">3 - Average</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>

            {/* Sentiment */}
            <div className="mb-6">
              <label
                htmlFor="sentiment"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Sentiment
              </label>

              <select
                id="sentiment"
                value={sentiment}
                onChange={(event) => setSentiment(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select sentiment</option>
                <option value="POSITIVE">Positive</option>
                <option value="NEGATIVE">Negative</option>
                <option value="NEUTRAL">Neutral</option>
              </select>
            </div>

            {/* Success */}
            {message && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Add Feedback"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/feedback")}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}


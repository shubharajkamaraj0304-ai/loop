"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateReportPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/reports", {
        method: "POST",
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
        throw new Error(data.error || "Failed to create report");
      }

      router.push("/reports");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to create report."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        padding: "30px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "25px" }}>
        <button
          type="button"
          onClick={() => router.push("/reports")}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
            color: "#555",
            marginBottom: "15px",
          }}
        >
          ← Back to Reports
        </button>

        <h1 style={{ margin: 0, fontSize: "30px" }}>Create Report</h1>

        <p style={{ color: "#666", marginTop: "8px" }}>
          Create a new Voice of Customer report.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "15px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "25px",
          background: "white",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="title"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Report Title
          </label>

          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter report title"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "15px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="content"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Report Content
          </label>

          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your report content..."
            rows={12}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "15px",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            background: loading ? "#999" : "#111",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "15px",
          }}
        >
          {loading ? "Creating..." : "Create Report"}
        </button>
      </form>
    </main>
  );
}
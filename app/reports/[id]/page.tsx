"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Report = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReport() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/reports/${params.id}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load report");
      }

      setReport(data.data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to load report."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) {
      loadReport();
    }
  }, [params.id]);

  if (loading) {
    return (
      <main style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
        <p>Loading report...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
        <button
          onClick={() => router.push("/reports")}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 0,
            color: "#555",
          }}
        >
          ← Back to Reports
        </button>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
        <p>Report not found.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <button
        onClick={() => router.push("/reports")}
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: 0,
          color: "#555",
          marginBottom: "20px",
        }}
      >
        ← Back to Reports
      </button>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "25px",
          background: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "30px" }}>{report.title}</h1>

            <p style={{ color: "#777", marginTop: "8px" }}>
              Created:{" "}
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>

          <span
            style={{
              padding: "6px 10px",
              height: "fit-content",
              borderRadius: "20px",
              background: "#f3f4f6",
              fontSize: "13px",
            }}
          >
            Report #{report.id}
          </span>
          <button
  onClick={() => {
    const newTitle = prompt("Enter new report title:", report.title);

    if (newTitle === null) return;

    const newContent = prompt(
      "Enter new report content:",
      report.content
    );

    if (newContent === null) return;

    fetch(`/api/reports/${report.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTitle,
        content: newContent,
      }),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update report");
        }

        await loadReport();
      })
      .catch((err) => {
        console.error(err);
        alert(err instanceof Error ? err.message : "Failed to update report");
      });
  }}
  style={{
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
  }}
>
  Edit
</button>
<button
  onClick={async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete report");
      }

      router.push("/reports");
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete report"
      );
    }
  }}
  style={{
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #dc2626",
    background: "#fff",
    color: "#dc2626",
    cursor: "pointer",
  }}
>
  Delete
</button>
        </div>

        <div
          style={{
            borderTop: "1px solid #eee",
            paddingTop: "20px",
            whiteSpace: "pre-wrap",
            lineHeight: "1.7",
            color: "#333",
          }}
        >
          {report.content}
        </div>
      </div>
    </main>
  );
}
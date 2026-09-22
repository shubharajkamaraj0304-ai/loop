"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Report = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function ReportsPage() {
const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/reports");

      if (!response.ok) {
        throw new Error("Failed to load reports");
      }

     const data = await response.json();

console.log("Reports API response:", data);

if (Array.isArray(data)) {
  setReports(data);
} else if (Array.isArray(data.reports)) {
  setReports(data.reports);
} else if (Array.isArray(data.data)) {
  setReports(data.data);
} else {
  setReports([]);
}
    } catch (err) {
      console.error(err);
      setError("Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <main style={{ padding: "30px", maxWidth: "1100px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "30px" }}>Reports</h1>
          <p style={{ color: "#666", marginTop: "8px" }}>
            View your Voice of Customer reports.
          </p>
        </div>

       <div style={{ display: "flex", gap: "10px" }}>
  <button
    onClick={() => router.push("/reports/create")}
    style={{
      padding: "10px 16px",
      borderRadius: "8px",
      border: "none",
      background: "#111",
      color: "white",
      cursor: "pointer",
    }}
  >
    + Create Report
  </button>

  <button
    onClick={loadReports}
    style={{
      padding: "10px 16px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      background: "white",
      cursor: "pointer",
    }}
  >
    Refresh
  </button>
</div>
      </div>

      {loading && <p>Loading reports...</p>}

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

      {!loading && !error && reports.length === 0 && (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <h2>No reports found</h2>
          <p style={{ color: "#666" }}>
            There are currently no reports in this workspace.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: "20px" }}>
        {reports.map((report) => (
          <div
            key={report.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "22px",
              background: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
                marginBottom: "15px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "22px" }}>
                  {report.title}
                </h2>

                <p
                  style={{
                    marginTop: "8px",
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
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
            </div>

           <div
  style={{
    borderTop: "1px solid #eee",
    paddingTop: "15px",
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
    color: "#333",
  }}
>
  {report.content}
</div>

<button
  onClick={() => router.push(`/reports/${report.id}`)}
  style={{
    marginTop: "18px",
    padding: "9px 14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
  }}
>
  View Details →
</button>
          </div>
        ))}
      </div>
    </main>
  );
}
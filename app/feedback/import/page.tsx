"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";

export default function FeedbackImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null;

    setMessage("");
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setError("Please select a CSV file.");
      return;
    }

    setFile(selectedFile);
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/feedback/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "CSV import failed.");
        return;
      }

      setMessage("CSV imported successfully.");

      setFile(null);

      const input = document.getElementById(
        "csvFile"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/feedback"
          className="mb-5 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Back to Feedback
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Import Feedback
          </h1>

          <p className="mt-1 text-gray-500">
            Upload a CSV file to import customer feedback.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <form onSubmit={handleImport}>

            <label
              htmlFor="csvFile"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Select CSV File
            </label>

            <input
              id="csvFile"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="w-full rounded-lg border border-gray-300 bg-white p-3"
            />

            {file && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">
                  Selected file
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  {file.name}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Importing..." : "Import CSV"}
            </button>

          </form>

        </div>

      </div>
    </main>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  createdAt: string;
  updatedAt: string;
};

export default function WorkspaceUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/workspace/users");
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to load workspace users.");
        return;
      }

      setUsers(result.data);
    } catch (error) {
      console.error("Failed to load users:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function getRoleLabel(role: User["role"]) {
    if (role === "ADMIN") return "Admin";
    if (role === "ANALYST") return "Analyst";
    return "Viewer";
  }

  function getRoleClass(role: User["role"]) {
    if (role === "ADMIN") {
      return "bg-red-100 text-red-700";
    }

    if (role === "ANALYST") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl rounded-xl border bg-white p-10 text-center">
          Loading workspace users...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/workspace"
            className="mb-4 inline-block text-sm text-blue-600 hover:underline"
          >
            ← Back to Workspace
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">
            Workspace Users
          </h1>

          <p className="mt-1 text-gray-500">
            View the users and roles in your LOOP workspace.
          </p>
        </div>

        {/* User count */}
        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Users
          </p>

          <p className="mt-1 text-3xl font-bold text-gray-900">
            {users.length}
          </p>
        </div>

        {/* Users */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Users
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="divide-y">

              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    {/* User information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {user.email}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        User ID: {user.id}
                      </p>
                    </div>

                    {/* Role and date */}
                    <div className="flex flex-col items-start gap-2 md:items-end">

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getRoleClass(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>

                      <p className="text-xs text-gray-400">
                        Created{" "}
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>

                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </main>
  );
}
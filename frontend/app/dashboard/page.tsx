"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";

type Resume = {
  id: number;
  file_name: string;
  status: "PENDING" | "COMPLETED";
  overall_score: number | null;
  skill_score: number | null;
  created_at: string;
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-sm text-muted-foreground">—</span>;
  const color =
    score >= 75
      ? "text-green-600"
      : score >= 50
        ? "text-yellow-600"
        : "text-red-500";
  return <span className={`text-lg font-bold ${color}`}>{score}%</span>;
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await api.get("/api/analyze", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResumes(res.data);
      } catch (err) {
        console.error("Failed to load resumes", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completed = resumes.filter((r) => r.status === "COMPLETED");
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((s, r) => s + (r.overall_score ?? 0), 0) /
            completed.length,
        )
      : null;
  const bestScore =
    completed.length > 0
      ? Math.max(...completed.map((r) => r.overall_score ?? 0))
      : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Your resume analyses
          </h1>
        </div>
        <Link
          href="/analyze"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          New analysis
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Analyses</p>
          <p className="mt-2 text-2xl font-semibold">{resumes.length}</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Average match</p>
          <p className="mt-2 text-2xl font-semibold">
            {avgScore !== null ? `${avgScore}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Best match</p>
          <p className="mt-2 text-2xl font-semibold">
            {bestScore !== null ? `${bestScore}%` : "—"}
          </p>
        </div>
      </div>

      {/* List */}
      <section className="mt-12">
        <h2 className="text-lg font-medium">Recent analyses</h2>

        <div className="mt-4 overflow-hidden rounded-xl border">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No analyses yet.{" "}
              <Link href="/analyze" className="underline">
                Start your first one.
              </Link>
            </div>
          ) : (
            resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex flex-col justify-between gap-4 border-b p-5 last:border-b-0 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-medium">{resume.file_name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(resume.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  {resume.status === "PENDING" ? (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                      Analyzing...
                    </span>
                  ) : (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Match</p>
                      <ScoreBadge score={resume.overall_score} />
                    </div>
                  )}

                  <Link
                    href={`/dashboard/${resume.id}`}
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                  >
                    View report
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

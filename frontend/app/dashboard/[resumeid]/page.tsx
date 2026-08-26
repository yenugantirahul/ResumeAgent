"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import Link from "next/link";

type ResumeDetail = {
  id: number;
  file_name: string;
  status: "PENDING" | "COMPLETED";
  overall_score?: number;
  overallScore?: number;
  skill_score?: number;
  skillScore?: number;
  matched_skills?: string[];
  matchedSkills?: string[];
  missing_skills?: string[];
  missingSkills?: string[];
  match_summary?: string;
  matchSummary?: string;
  suggestions?: string[];
  summary?: string;
  improvementSummary?: string;
  created_at: string;
};

export default function ResumeDetailPage() {
  const { resumeid } = useParams<{ resumeid: string }>();
  const { getToken } = useAuth();
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await api.get(`/api/analyze/${resumeid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResume(res.data);
      } catch (err: any) {
        if (err?.response?.status === 404) setNotFound(true);
        else console.error("Failed to load resume details:", err);
      } finally {
        setLoading(false);
      }
    }
    if (resumeid) {
      load();
    }
  }, [resumeid]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center text-muted-foreground">
        Loading...
      </main>
    );
  }

  if (notFound || !resume) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-muted-foreground">Resume not found.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  if (resume.status === "PENDING") {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-lg font-medium">Analysis in progress...</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This usually takes 15–30 seconds. Refresh to check.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const overallScore = resume.overallScore ?? resume.overall_score ?? 0;
  const skillScore = resume.skillScore ?? resume.skill_score ?? 0;
  const matchedSkills = resume.matchedSkills ?? resume.matched_skills ?? [];
  const missingSkills = resume.missingSkills ?? resume.missing_skills ?? [];
  const matchSummary = resume.matchSummary ?? resume.match_summary ?? "";
  const suggestions = resume.suggestions ?? [];
  const improvementSummary = resume.improvementSummary ?? resume.summary ?? "";

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground">{resume.file_name}</span>
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Resume Report
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Analysed on{" "}
        {new Date(resume.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {/* Analysis Results */}
      <div className="mt-8 space-y-6">
        <div className="flex gap-6">
          <div className="rounded-xl border p-6 text-center">
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <p className="mt-1 text-4xl font-bold">{overallScore}</p>
          </div>
          <div className="rounded-xl border p-6 text-center">
            <p className="text-sm text-muted-foreground">Skill Score</p>
            <p className="mt-1 text-4xl font-bold">{skillScore}</p>
          </div>
        </div>

        {matchSummary && (
          <p className="text-muted-foreground">{matchSummary}</p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Matched Skills</p>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length > 0 ? (
                matchedSkills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border bg-muted px-3 py-1 text-xs"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No matched skills
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Missing Skills</p>
            <div className="flex flex-wrap gap-2">
              {missingSkills.length > 0 ? (
                missingSkills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No missing skills
                </p>
              )}
            </div>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium">Suggestions</p>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 text-foreground">→</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {improvementSummary && (
          <p className="text-sm text-muted-foreground">{improvementSummary}</p>
        )}
      </div>

      <div className="mt-10 flex items-center gap-4">
        <Link
          href="/analyze"
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          Analyze another resume
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

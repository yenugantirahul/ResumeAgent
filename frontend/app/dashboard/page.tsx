import Link from "next/link";
import type { Metadata } from "next";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ResumeAgent | Dashboard",
};

const analyses = [
  {
    id: 1,
    role: "Backend Engineer",
    company: "Acme",
    score: 82,
    date: "12 Aug 2026",
  },
  {
    id: 2,
    role: "Software Engineer",
    company: "Northstar",
    score: 76,
    date: "10 Aug 2026",
  },
];

export default function DashboardPage() {
 
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
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

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            Analyses
          </p>

          <p className="mt-2 text-2xl font-semibold">2</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            Average match
          </p>

          <p className="mt-2 text-2xl font-semibold">79%</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">
            Best match
          </p>

          <p className="mt-2 text-2xl font-semibold">82%</p>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Recent analyses
          </h2>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="flex flex-col justify-between gap-4 border-b p-5 last:border-b-0 sm:flex-row sm:items-center"
            >
              <div>
                <h3 className="font-medium">
                  {analysis.role}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {analysis.company} · {analysis.date}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Match
                  </p>

                  <p className="font-semibold">
                    {analysis.score}%
                  </p>
                </div>

                <button className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
                  View report
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
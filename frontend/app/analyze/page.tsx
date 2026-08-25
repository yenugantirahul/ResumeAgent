"use client";

import { createSupabaseClient } from "@/config/supabase";
import { api } from "@/lib/axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ResumeResult = {
  overallScore: number;
  skillScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchSummary: string;
  suggestions: string[];
  improvementSummary: string;
};

type Status = "idle" | "uploading" | "analyzing" | "done" | "error";

export default function AnalyzePage() {
  const { isSignedIn } = useUser();
  const { getToken, userId } = useAuth();
  const [jd, setJd] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createSupabaseClient(getToken);

  if (!isSignedIn) {
    redirect("/sign-in");
  }

  async function handleSubmit() {
    if (!jd.trim()) {
      setErrorMsg("Job description is required.");
      return;
    }
    if (!file || !userId) {
      setErrorMsg("Please select a resume file.");
      return;
    }

    setErrorMsg(null);
    setResult(null);

    // ── Step 1: Upload PDF to Supabase Storage ───────────────────────────────
    setStatus("uploading");
    const fileName = `${userId}/${crypto.randomUUID()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("Resumes")
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setStatus("error");
      setErrorMsg(`Upload failed: ${uploadError.message}`);
      return;
    }

    // ── Step 2: Trigger background analysis pipeline ─────────────────────────
    // Backend fires Trigger.dev task and returns { resumeId } immediately.
    setStatus("analyzing");
    const token = await getToken();

    let resumeId: number;
    try {
      const res = await api.post(
        "/analyze",
        {
          filePath: uploadData.path,
          fileName: file.name,
          jobDescription: jd,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      resumeId = res.data.resumeId;
      console.log("[analyze] Analysis complete, resumeId:", resumeId);

      // Service is synchronous — result is already in the response
      setResult({
        overallScore: res.data.overallScore,
        skillScore: res.data.skillScore,
        matchedSkills: res.data.matchedSkills ?? [],
        missingSkills: res.data.missingSkills ?? [],
        matchSummary: res.data.matchSummary ?? "",
        suggestions: res.data.suggestions ?? [],
        improvementSummary: res.data.improvementSummary ?? "",
      });
      setStatus("done");
      return;
    } catch (err: any) {
      setStatus("error");
      const cause = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message;
      setErrorMsg(`Analysis failed: ${cause}`);
      return;
    }

    // ── Step 3: Subscribe to Supabase Realtime ───────────────────────────────
    // When Trigger.dev finishes, it updates the resumes row from PENDING →
    // COMPLETED. Supabase pushes that change here instantly — no polling needed.
    const channel = supabase
      .channel(`resume-result-${resumeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "resumes",
          filter: `id=eq.${resumeId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row.status === "COMPLETED") {
            setResult({
              overallScore: row.overall_score,
              skillScore: row.skill_score,
              matchedSkills: row.matched_skills ?? [],
              missingSkills: row.missing_skills ?? [],
              matchSummary: row.match_summary ?? "",
              suggestions: row.suggestions ?? [],
              improvementSummary: row.summary ?? "",
            });
            setStatus("done");
            // Unsubscribe after receiving the result
            supabase.removeChannel(channel);
          }
        },
      )
      .subscribe();
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const isLoading = status === "uploading" || status === "analyzing";

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Resume analysis
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Analyze your resume
        </h1>
        <p className="mt-3 text-muted-foreground">
          Upload your resume and add the job description you want to target.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {/* File upload */}
        <section>
          <label className="mb-3 block text-sm font-medium">Resume</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center hover:bg-muted/50"
          >
            {file ? (
              <>
                <p className="font-medium">{file.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Upload your resume</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  PDF files only
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {isSignedIn ? "Choose file" : "Login to analyze"}
                </button>
              </>
            )}
          </div>
        </section>

        {/* Job description */}
        <section>
          <label
            htmlFor="job-description"
            className="mb-3 block text-sm font-medium"
          >
            Job description
          </label>
          <textarea
            onChange={(e) => setJd(e.target.value)}
            id="job-description"
            placeholder="Paste the job description here..."
            className="min-h-64 w-full resize-none rounded-xl border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </section>

        {/* Error */}
        {errorMsg && (
          <p className="text-sm text-red-500">{errorMsg}</p>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={isLoading}
            className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {status === "uploading"
              ? "Uploading..."
              : status === "analyzing"
                ? "Analyzing..."
                : "Analyze resume"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-12 space-y-6">
          <div className="flex gap-6">
            <div className="rounded-xl border p-6 text-center">
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <p className="mt-1 text-4xl font-bold">{result.overallScore}</p>
            </div>
            <div className="rounded-xl border p-6 text-center">
              <p className="text-sm text-muted-foreground">Skill Score</p>
              <p className="mt-1 text-4xl font-bold">{result.skillScore}</p>
            </div>
          </div>

          <p className="text-muted-foreground">{result.matchSummary}</p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 text-sm font-medium">Matched Skills</p>
              <div className="flex flex-wrap gap-2">
                {result.matchedSkills.map((s) => (
                  <span key={s} className="rounded-full border bg-muted px-3 py-1 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Missing Skills</p>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((s) => (
                  <span key={s} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">Suggestions</p>
            <ul className="space-y-2">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 text-foreground">→</span> {s}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">{result.improvementSummary}</p>
        </div>
      )}
    </main>
  );
}

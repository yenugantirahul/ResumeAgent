"use client";

import { createSupabaseClient } from "@/config/supabase";
import { api } from "@/lib/axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";

type Status = "idle" | "uploading" | "submitting" | "submitted" | "error";

export default function AnalyzePage() {
  const { isSignedIn } = useUser();
  const { getToken, userId } = useAuth();
  const [jd, setJd] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [submittedResumeId, setSubmittedResumeId] = useState<number | null>(null);
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

    // ── Step 1: Upload PDF to Supabase Storage ─────────────────────────────────
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

    // ── Step 2: Enqueue BullMQ analysis job ────────────────────────────────────
    setStatus("submitting");
    const token = await getToken();

    try {
      const res = await api.post(
        "/analyze",
        {
          filePath: uploadData.path,
          fileName: file.name,
          jobDescription: jd,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const resumeId = res.data.resumeId;
      setSubmittedResumeId(resumeId);
      setStatus("submitted");
    } catch (err: any) {
      setStatus("error");
      const cause =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message;
      setErrorMsg(`Analysis failed: ${cause}`);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const isLoading = status === "uploading" || status === "submitting";

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

      {status === "submitted" ? (
        <div className="mt-10 rounded-2xl border bg-card p-8 shadow-sm text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Resume Analysis Started!
            </h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Your resume has been submitted and is currently being analyzed by our AI background worker.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 max-w-md mx-auto text-left space-y-1 text-sm">
            <p><span className="font-medium text-foreground">File:</span> {file?.name}</p>
            <p><span className="font-medium text-foreground">Status:</span> <span className="inline-flex items-center text-yellow-600 font-medium">Processing in background...</span></p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Go to Dashboard to view resume result →
            </Link>

            {submittedResumeId && (
              <Link
                href={`/dashboard/${submittedResumeId}`}
                className="w-full sm:w-auto rounded-lg border bg-background px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                View Report Directly
              </Link>
            )}
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={() => {
                setStatus("idle");
                setFile(null);
                setJd("");
                setSubmittedResumeId(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Analyze another resume
            </button>
          </div>
        </div>
      ) : (
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
              className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center hover:bg-muted/50 transition-colors"
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
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              id="job-description"
              placeholder="Paste the job description here..."
              className="min-h-64 w-full resize-none rounded-xl border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* Error */}
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              disabled={isLoading}
              className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {status === "uploading"
                ? "Uploading resume..."
                : status === "submitting"
                  ? "Starting AI analysis..."
                  : "Analyze resume"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
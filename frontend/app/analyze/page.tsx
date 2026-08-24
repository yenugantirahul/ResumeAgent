"use client";

import { createSupabaseClient } from "@/config/supabase";
import { api } from "@/lib/axios";
import type { AxiosRequestConfig } from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useRef, useState } from "react";

export default function AnalyzePage() {
  const { isSignedIn } = useUser();
  const { getToken, userId } = useAuth();
  const [jd, setJd] = useState<string>();
  const supabase = createSupabaseClient(getToken);
  if (!isSignedIn) {
    redirect("/sign-in");
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  // This function uploads the file to the supabase
  async function handleSubmit() {
    if (!jd) {
      console.error("Job description is Empty");
      return;
    }
    if (!file || !userId) {
      console.log("No file or user");
      return;
    }

    const fileName = `${userId}/${crypto.randomUUID()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("Resumes")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    console.log("[upload] result →", { data, error });

    if (error) {
      console.error("Upload failed:", error.message);
      return;
    }

    console.log("Uploaded:", data);
    console.log(
      "[analyze] data.path:",
      data.path,
      "| data.fullPath:",
      data.fullPath,
    );
    const token = await getToken();

    try {
      const res = await api.post(
        "/analyze",
        {
          filePath: data.path,
          jobDescription: jd,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("overallScore:", res.data.overallScore);
      console.log("skillScore:", res.data.skillScore);
      console.log("matchedSkills:", JSON.stringify(res.data.matchedSkills));
      console.log("missingSkills:", JSON.stringify(res.data.missingSkills));
      console.log("matchSummary:", res.data.matchSummary);
      console.log("suggestions:", JSON.stringify(res.data.suggestions));
      console.log("improvementSummary:", res.data.improvementSummary);
    } catch (err: any) {
      console.error(
        "[analyze] request failed:",
        err?.response?.data ?? err?.message,
      );
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

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
        <section>
          <label className="mb-3 block text-sm font-medium">Resume</label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            onClick={handleChooseFile}
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
                  PDF or Word files only
                </p>

                <button
                  type="button"
                  disabled={isSignedIn}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleChooseFile();
                  }}
                  className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  {isSignedIn ? "Choose file" : "Login to analyze"}
                </button>
              </>
            )}
          </div>
        </section>

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

        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
          >
            Analyze resume
          </button>
        </div>
      </div>
    </main>
  );
}
